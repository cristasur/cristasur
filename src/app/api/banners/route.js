// GET  /api/banners  — público, solo activos (?all=1 con sesión de admin: todos)
// POST /api/banners  — admin
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Banner from '@/models/Banner'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await dbConnect()
    // ?all=1 lo usa el panel: ahí se necesitan también los inactivos,
    // si no, un banner desactivado desaparece y ya no se puede prender.
    let filtro = { active: true }
    if (new URL(request.url).searchParams.get('all') === '1') {
      const user = await getCurrentUser()
      if (user && ['admin', 'editor'].includes(user.role)) filtro = {}
    }
    const banners = await Banner.find(filtro)
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
