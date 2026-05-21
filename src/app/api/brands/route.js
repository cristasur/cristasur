// ============================================================
// GET  /api/brands  — lista de marcas (público, activas)
// POST /api/brands  — crear marca (admin/editor)
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Brand from '@/models/Brand'
import { getCurrentUser } from '@/lib/auth'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request) {
  await dbConnect()
  const { searchParams } = new URL(request.url)
  const all = searchParams.get('all') === '1'

  const filter = all ? {} : { active: true }
  const brands = await Brand.find(filter).sort({ order: 1, name: 1 }).lean()

  return NextResponse.json({ brands })
}

export async function POST(request) {
  try {
    const user = await getCurrentUser()
    if (!user || !['admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await dbConnect()
    const body = await request.json()
    const { name, order = 0, active = true } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const slug = slugify(name.trim())
    const existing = await Brand.findOne({ slug })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una marca con ese nombre' }, { status: 409 })
    }

    const brand = await Brand.create({ name: name.trim(), slug, order, active })
    return NextResponse.json({ brand }, { status: 201 })
  } catch (err) {
    console.error('POST /api/brands', err)
    return NextResponse.json({ error: 'Error al crear marca' }, { status: 500 })
  }
}
