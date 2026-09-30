import { beforeEach, it, expect, vi } from 'vitest'
const mock = vi.hoisted(() => ({ find: vi.fn(), create: vi.fn(), coupon: vi.fn(), quote: vi.fn(), user: vi.fn() }))
vi.mock('@/lib/mongodb', () => ({ default: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mock.user }))
vi.mock('@/models/Product', () => ({ default: { find: mock.find } }))
vi.mock('@/models/Order', () => ({ default: { create: mock.create } }))
vi.mock('@/models/Coupon', () => ({ default: { findOne: mock.coupon } }))
vi.mock('@/lib/shipping-token', () => ({ verifyShippingQuote: mock.quote }))
vi.mock('@/lib/rate-limit', () => ({ rateLimit: () => ({ ok: true }), clientIp: () => 'test' }))
import { POST, GET } from '@/app/api/orders/route'

const id = 'a'.repeat(24)
const item = { productId: id, name: 'Inventado', qty: 2, unitPrice: 0 }
beforeEach(() => {
  mock.find.mockReturnValue({ select: () => ({ lean: async () => [{ _id: id, name: 'Real', price: 100, stock: 10, categories: [] }] }) })
  mock.create.mockImplementation(async (data) => ({ ...data, _id: 'order' }))
  mock.coupon.mockResolvedValue(null)
  mock.quote.mockResolvedValue({ price: 120, label: 'Tarifa verificada' })
  mock.user.mockResolvedValue(null)
})
const request = (body) => new Request('https://example.test/api/orders', { method: 'POST', body: JSON.stringify(body) })

it.each([undefined, 'invalid', ''])('rechaza productos sin ID válido (%s)', async (productId) => {
  const response = await POST(request({ items: [{ ...item, productId }] }))
  expect(response.status).toBe(400)
  expect(mock.create).not.toHaveBeenCalled()
})
it('rechaza productos inexistentes o no publicados y filtra publicación en DB', async () => {
  mock.find.mockReturnValue({ select: () => ({ lean: async () => [] }) })
  expect((await POST(request({ items: [item] }))).status).toBe(409)
  expect(mock.find.mock.calls[0][0]).toMatchObject({ active: true, deleted: { $ne: true }, $and: expect.any(Array) })
  expect(mock.create).not.toHaveBeenCalled()
})
it('ignora precio, nombre y descuento inventados', async () => {
  const response = await POST(request({ items: [item], discount: 9999 }))
  const data = await response.json()
  expect(data.pedido).toMatchObject({ total: 200, discount: 0, items: [{ name: 'Real', qty: 2, unitPrice: 100 }] })
})
it('rechaza líneas duplicadas para impedir exceder stock', async () => {
  expect((await POST(request({ items: [item, item] }))).status).toBe(400)
  expect(mock.create).not.toHaveBeenCalled()
})
it('no cobra una tarifa sin firma, pero no bloquea el pedido', async () => {
  mock.quote.mockRejectedValue(new Error('invalid token'))
  const response = await POST(request({ items: [item], shipping: { token: 'falso', price: 1 } }))
  expect(response.status).toBe(200)
  expect((await response.json()).pedido).toMatchObject({ shippingCost: 0, shippingLabel: 'Por confirmar', total: 200 })
})
it('acepta cantidades como texto', async () => {
  const response = await POST(request({ items: [{ ...item, qty: '2' }] }))
  expect(response.status).toBe(200)
  expect((await response.json()).pedido).toMatchObject({ total: 200 })
})
it('usa el envío verificado e ignora el precio del cliente', async () => {
  const response = await POST(request({ items: [item], shipping: { token: 'signed', price: 0 } }))
  expect((await response.json()).pedido).toMatchObject({ shippingCost: 120, total: 320 })
})
it('no expone pedidos a clientes aunque el middleware no se ejecute', async () => {
  mock.user.mockResolvedValue({ role: 'customer' })
  expect((await GET(new Request('https://example.test/api/orders'))).status).toBe(403)
})
it('no acepta una variante inexistente si ninguna variante tiene existencias', async () => {
  mock.find.mockReturnValue({ select: () => ({ lean: async () => [{
    _id: id, name: 'Termo', price: 100, categories: [],
    variants: [{ label: 'Color', value: 'Rojo', stock: 0 }],
  }] }) })
  const response = await POST(request({ items: [{ ...item, qty: 5000, variantLabel: 'Color', variantValue: 'Azul' }] }))
  expect(response.status).toBe(400)
  expect(mock.create).not.toHaveBeenCalled()
})
it('variante por confirmar: tope de existencias y pedido con pendientes', async () => {
  mock.find.mockReturnValue({ select: () => ({ lean: async () => [{
    _id: id, name: 'Termo', price: 100, categories: [],
    variants: [{ label: 'Color', value: 'Rojo', stock: 3 }, { label: 'Color', value: 'Verde', stock: 7 }],
  }] }) })
  const response = await POST(request({ items: [{ ...item, qty: 5000, variantLabel: 'Color', variantValue: 'Azul' }] }))
  expect(response.status).toBe(200)
  const saved = mock.create.mock.calls[0][0]
  expect(saved.items[0].qty).toBe(7)
  expect(saved.pendientes.length).toBeGreaterThan(0)
})
it('tarifa de prueba: no se suma al total y queda pendiente', async () => {
  mock.quote.mockResolvedValue({ price: 120, label: 'Tarifa', test: true })
  const response = await POST(request({ items: [item], shipping: { token: 'signed' } }))
  const saved = mock.create.mock.calls[0][0]
  expect((await response.json()).pedido).toMatchObject({ shippingCost: 0, total: 200 })
  expect(saved.pendientes).toContain('Confirmar costo de envío')
})
