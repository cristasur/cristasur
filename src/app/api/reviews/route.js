// ============================================================
// GET  /api/reviews
//   ?product=<id>         lista reseñas (sólo approved por defecto)
//   ?status=pending|all   (admin)
//   ?limit=20&skip=0
// POST /api/reviews       crea una reseña en estado "pending"
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import { validateReviewPayload } from '@/lib/validation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function getClientIp(request) {
  const fwd = request.headers.get('x-forwarded-for') || ''
  return fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || ''
}

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const productParam = (url.searchParams.get('product') || '').trim()
    const status = (url.searchParams.get('status') || '').trim()
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 50)
    const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0)

    const filter = {}
    if (productParam && mongoose.Types.ObjectId.isValid(productParam)) {
      filter.product = productParam
    }

    // Si alguien pide otro status que no sea approved, validamos que sea admin
    if (status && status !== 'approved') {
      const user = await getCurrentUser()
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      if (status !== 'all') filter.status = status
    } else {
      filter.status = 'approved'
    }

    const [reviews, total, avg] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
      productParam && mongoose.Types.ObjectId.isValid(productParam)
        ? Review.aggregate([
            { $match: { product: new mongoose.Types.ObjectId(productParam), status: 'approved' } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      reviews,
      total,
      limit,
      skip,
      average: avg?.[0]?.avg || 0,
      approvedCount: avg?.[0]?.count || 0,
    })
  } catch (err) {
    console.error('GET /api/reviews', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateReviewPayload(body)
    if (errors.length) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    await dbConnect()
    const exists = await Product.exists({ _id: value.product, deleted: { $ne: true } })
    if (!exists) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const review = await Review.create({
      ...value,
      status: 'pending',
      ip: getClientIp(request),
    })

    return NextResponse.json(
      {
        ok: true,
        review,
        message: '¡Gracias! Tu reseña será revisada antes de publicarse.',
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/reviews', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
