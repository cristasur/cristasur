// ============================================================
// PATCH /api/products/reorder
// Body: { order: ["id1", "id2", "id3", ...] }
// Asigna sortOrder 0, 1, 2, 3... a los productos según el
// array recibido. Usa bulkWrite para hacerlo en una sola op.
// Solo admins autenticados pueden llamar este endpoint.
// ============================================================
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function isObjectId(s) {
  return typeof s === 'string' && /^[a-f0-9]{24}$/i.test(s)
}

export async function PATCH(request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const order = Array.isArray(body?.order) ? body.order.filter(isObjectId) : []

    if (order.length === 0) {
      return NextResponse.json({ error: 'order requerido (array de IDs)' }, { status: 400 })
    }

    await dbConnect()

    const bulkOps = order.map((id, idx) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(id) },
        update: { $set: { sortOrder: idx } },
      },
    }))

    await Product.bulkWrite(bulkOps, { ordered: false })

    try {
      revalidatePath('/')
      revalidatePath('/productos')
    } catch {}

    return NextResponse.json({ ok: true, updated: order.length })
  } catch (err) {
    console.error('PATCH /api/products/reorder', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
