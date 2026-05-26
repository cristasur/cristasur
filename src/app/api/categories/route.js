// ============================================================
// GET  /api/categories       - lista pública (solo activas por defecto)
// POST /api/categories       - crea (protegido por middleware)
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import { validateCategoryPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const includeInactive = url.searchParams.get('all') === '1'
    const filter = includeInactive ? {} : { active: true }
    const categories = await Category.find(filter).sort({ order: 1, name: 1 }).lean()
    return NextResponse.json({ categories })
  } catch (err) {
    console.error('GET /api/categories', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateCategoryPayload(body)
    if (errors.length) {
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    }

    await dbConnect()
    // Evitamos duplicados insensibles a mayúsculas
    const existing = await Category.findOne({
      name: { $regex: `^${value.name}$`, $options: 'i' },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 })
    }
    const category = await Category.create(value)
    return NextResponse.json({ category }, { status: 201 })
  } catch (err) {
    console.error('POST /api/categories', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
