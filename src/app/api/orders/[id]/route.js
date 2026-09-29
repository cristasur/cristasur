// PATCH  /api/orders/:id  → cambiar estado y notas (admin)
// DELETE /api/orders/:id  → eliminar pedido de la BD (solo admin supremo)
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import Coupon from '@/models/Coupon'
import { getCurrentUser } from '@/lib/auth'
import { updateOrderStatus } from '@/lib/order-status'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_STATUS = new Set(['intent', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])

export async function PATCH(request, { params }) {
  params = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['admin', 'editor'].includes(user.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }
  await dbConnect()
  const body = await request.json().catch(() => ({}))
  const update = { handledBy: user.sub }
  if (body?.status && ALLOWED_STATUS.has(body.status)) {
    update.status = body.status
    if (body.status === 'confirmed') update.confirmedAt = new Date()
    if (body.status === 'delivered') update.deliveredAt = new Date()
    if (body.status === 'cancelled') update.cancelledAt = new Date()
  }
  if (typeof body?.notes === 'string') update.notes = body.notes.slice(0, 500)
  if (typeof body?.cancelReason === 'string') update.cancelReason = body.cancelReason.slice(0, 200)

  try {
    const order = await updateOrderStatus({ connection: mongoose.connection, Order, Coupon, id: params.id, update })
    if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) })
  } catch (error) {
    console.error('Actualizar pedido', error)
    return NextResponse.json({ error: error.status === 409 ? error.message : 'No se pudo actualizar el pedido. Intenta nuevamente.' }, { status: error.status || 500 })
  }
}

export async function DELETE(_, { params }) {
  params = await params
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo el admin puede eliminar pedidos' }, { status: 403 })
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }
  await dbConnect()
  const order = await Order.findByIdAndDelete(params.id)
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function GET(_, { params }) {
  params = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!['admin', 'editor'].includes(user.role)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }
  await dbConnect()
  const order = await Order.findById(params.id).lean()
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) })
}
