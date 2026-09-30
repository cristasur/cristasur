// La transacción revierte tanto el estado como el contador si algo falla.
export async function updateOrderStatus({ connection, Order, Coupon, id, update, now = new Date() }) {
  return connection.transaction(async (session) => {
    const order = await Order.findById(id).session(session)
    if (!order) return null
    // Una solicitud con pendientes (variante sin elegir, envío sin tarifa)
    // no se confirma hasta resolverlos desde el panel.
    const pendientes = update.pendientes ?? order.pendientes ?? []
    if (['confirmed', 'shipped', 'delivered'].includes(update.status) && pendientes.length) {
      const error = new Error(`Antes de confirmar resuelve: ${pendientes.join('; ')}.`)
      error.status = 409
      throw error
    }
    if (['confirmed', 'shipped', 'delivered'].includes(update.status) && order.couponCode && !order.couponCounted) {
      const coupon = await Coupon.findOneAndUpdate({
        code: order.couponCode, active: true,
        $and: [
          { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
          { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
          { $or: [{ usageLimit: 0 }, { usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }] },
        ],
      }, { $inc: { usageCount: 1 } }, { session, new: true })
      if (!coupon) {
        const error = new Error('El cupón venció o agotó sus usos. Revisa el pedido antes de confirmarlo.')
        error.status = 409
        throw error
      }
      order.couponCounted = true
    }
    Object.assign(order, update)
    await order.save({ session })
    return order.toObject()
  })
}
