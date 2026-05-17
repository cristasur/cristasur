// PATCH /api/orders/:id  → cambiar estado y notas (admin)
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Order from '@/models/Order'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_STATUS = new Set(['intent', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])

export async function PATCH(request, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

  const order = await Order.findByIdAndUpdate(params.id, { $set: update }, { new: true }).lean()
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) })
}

export async function GET(_, { params }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }
  await dbConnect()
  const order = await Order.findById(params.id).lean()
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ order: JSON.parse(JSON.stringify(order)) })
}
