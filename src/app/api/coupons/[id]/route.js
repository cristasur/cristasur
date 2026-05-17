// ============================================================
// GET    /api/coupons/:id  (admin)
// PUT    /api/coupons/:id  (admin)
// DELETE /api/coupons/:id  (admin)
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import { validateCouponPayload } from '@/lib/validation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    const coupon = await Coupon.findById(params.id).lean()
    if (!coupon) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ coupon })
  } catch (err) {
    console.error('GET /api/coupons/:id', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateCouponPayload(body)
    if (errors.length) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }
    await dbConnect()
    const coupon = await Coupon.findByIdAndUpdate(params.id, value, {
      new: true,
      runValidators: true,
    })
    if (!coupon) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ coupon })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'Código de cupón ya existe' }, { status: 409 })
    }
    console.error('PUT /api/coupons/:id', err)
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
      return NextResponse.json({ error: 'Editor no puede eliminar cupones' }, { status: 403 })
    }
    const res = await Coupon.findByIdAndDelete(params.id)
    if (!res) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/coupons/:id', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
