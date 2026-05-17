// ============================================================
// GET  /api/coupons   (admin) lista cupones
//   ?active=1 filtra sólo activos
// POST /api/coupons   (admin) crea cupón
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Coupon from '@/models/Coupon'
import { validateCouponPayload } from '@/lib/validation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const active = url.searchParams.get('active') === '1'
    const filter = {}
    if (active) filter.active = true
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 }).lean()
    return NextResponse.json({ coupons })
  } catch (err) {
    console.error('GET /api/coupons', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateCouponPayload(body)
    if (errors.length) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }
    await dbConnect()
    const user = await getCurrentUser()
    const coupon = await Coupon.create({
      ...value,
      createdBy: user?.sub,
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'Código de cupón ya existe' }, { status: 409 })
    }
    console.error('POST /api/coupons', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
