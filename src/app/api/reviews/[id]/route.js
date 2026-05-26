// ============================================================
// PATCH  /api/reviews/:id  -> { action: 'approve'|'reject'|'pending' }
// DELETE /api/reviews/:id
// Ambos requieren auth (middleware lo aplica).
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import { getCurrentUser } from '@/lib/auth'

// Recalcula avgRating y reviewCount en el producto padre
async function refreshProductRating(productId) {
  try {
    const agg = await Review.aggregate([
      { $match: { product: productId, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    const avg = agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0
    const count = agg[0]?.count ?? 0
    await Product.findByIdAndUpdate(productId, { avgRating: avg, reviewCount: count })
  } catch {}
}

export const dynamic = 'force-dynamic'

export async function PATCH(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const action = String(body?.action || '').toLowerCase()
    const map = { approve: 'approved', reject: 'rejected', pending: 'pending' }
    if (!map[action]) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    await dbConnect()
    const user = await getCurrentUser()
    const review = await Review.findByIdAndUpdate(
      params.id,
      { status: map[action], moderatedBy: user?.sub, moderatedAt: new Date() },
      { new: true }
    )
    if (!review) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }
    // Actualizar caché de rating en el producto
    await refreshProductRating(review.product)
    return NextResponse.json({ ok: true, review })
  } catch (err) {
    console.error('PATCH /api/reviews/:id', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    const user = await getCurrentUser()
    if (user?.role === 'editor') {
      return NextResponse.json({ error: 'Editor no puede eliminar reseñas' }, { status: 403 })
    }
    const r = await Review.findByIdAndDelete(params.id)
    if (!r) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/reviews/:id', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
