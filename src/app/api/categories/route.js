// ============================================================
// GET  /api/categories       - lista pública (solo activas por defecto)
// POST /api/categories       - crea (protegido por middleware)
// ============================================================
import { soloStaff } from '@/lib/permisos'
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import { esPrincipal } from '@/lib/categoryParents'
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
  const bloqueo = await soloStaff()
  if (bloqueo) return bloqueo
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
    // Solo dos niveles: el padre elegido no puede ser ya una subcategoría.
    // Todos los padres deben existir y ser principales.
    if (value.parents.length) {
      const padres = await Category.find({ _id: { $in: value.parents } }).select('parent parents').lean()
      if (padres.length !== value.parents.length)
        return NextResponse.json({ error: 'Alguna categoría padre no existe' }, { status: 400 })
      if (padres.some((p) => !esPrincipal(p)))
        return NextResponse.json({
          error: 'Una de esas categorías ya es subcategoría. Solo se admiten dos niveles.',
        }, { status: 400 })
    }
    const category = await Category.create(value)
    return NextResponse.json({ category }, { status: 201 })
  } catch (err) {
    console.error('POST /api/categories', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
