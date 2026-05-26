// GET  /api/banners  — público, solo activos
// POST /api/banners  — admin
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Banner from '@/models/Banner'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await dbConnect()
    const banners = await Banner.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .lean()
    return NextResponse.json({ banners: JSON.parse(JSON.stringify(banners)) })
  } catch (err) {
    console.error('GET /api/banners', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    await dbConnect()
    const body = await request.json().catch(() => ({}))
    if (!body.image) return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 })

    const banner = await Banner.create(body)
    return NextResponse.json({ banner: JSON.parse(JSON.stringify(banner)) }, { status: 201 })
  } catch (err) {
    console.error('POST /api/banners', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
