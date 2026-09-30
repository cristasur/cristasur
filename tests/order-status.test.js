import { it, expect, vi } from 'vitest'
import { updateOrderStatus } from '@/lib/order-status'

// Simula el commit/rollback para verificar que ambas escrituras usan la misma sesión.
function fixture({ available = true, failSave = false, counted = false } = {}) {
  const state = { status: 'intent', couponCode: 'TEST', couponCounted: counted, count: 0 }
  const session = { id: 'transaction' }
  const connection = { transaction: async (fn) => {
    const before = { ...state }
    try { return await fn(session) } catch (error) { Object.assign(state, before); throw error }
  } }
  const Order = { findById: () => ({ session: async (received) => {
    expect(received).toBe(session)
    return { ...state, save: async function (options) {
      expect(options.session).toBe(session)
      if (failSave) throw new Error('save failed')
      state.status = this.status; state.couponCounted = this.couponCounted
    }, toObject() { return { ...state } } }
  } }) }
  const Coupon = { findOneAndUpdate: vi.fn(async (filter, change, options) => {
    expect(options.session).toBe(session)
    expect(filter.$and[2].$or).toContainEqual({ $expr: { $lt: ['$usageCount', '$usageLimit'] } })
    if (!available) return null
    state.count += change.$inc.usageCount
    return { code: 'TEST' }
  }) }
  return { state, Coupon, args: { connection, Order, Coupon, id: 'id', update: { status: 'confirmed' } } }
}
it('confirma y contabiliza una sola vez', async () => {
  const f = fixture()
  await updateOrderStatus(f.args)
  await updateOrderStatus({ ...f.args, update: { status: 'delivered' } })
  expect(f.state).toMatchObject({ status: 'delivered', couponCounted: true, count: 1 })
})
it('no confirma un cupón vencido o agotado', async () => {
  const f = fixture({ available: false })
  await expect(updateOrderStatus(f.args)).rejects.toMatchObject({ status: 409 })
  expect(f.state).toMatchObject({ status: 'intent', couponCounted: false, count: 0 })
})
it('revierte el contador si guardar el pedido falla', async () => {
  const f = fixture({ failSave: true })
  await expect(updateOrderStatus(f.args)).rejects.toThrow('save failed')
  expect(f.state).toMatchObject({ status: 'intent', couponCounted: false, count: 0 })
})
it('no vuelve a contar pedidos ya contabilizados', async () => {
  const f = fixture({ counted: true })
  await updateOrderStatus(f.args)
  expect(f.Coupon.findOneAndUpdate).not.toHaveBeenCalled()
})
it('no confirma una solicitud con pendientes', async () => {
  const f = fixture()
  f.state.pendientes = ['Confirmar costo de envío']
  await expect(updateOrderStatus(f.args)).rejects.toMatchObject({ status: 409 })
  expect(f.state).toMatchObject({ status: 'intent', couponCounted: false, count: 0 })
  expect(f.Coupon.findOneAndUpdate).not.toHaveBeenCalled()
})
