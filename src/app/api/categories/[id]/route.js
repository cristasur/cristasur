// ============================================================
// GET    /api/categories/:id  - detalle
// PUT    /api/categories/:id  - editar (protegido)
// DELETE /api/categories/:id  - eliminar (protegido)
// También acepta slug en :id para facilitar lookups públicos.
// ============================================================
import { soloStaff } from '@/lib/permisos'
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import { esPrincipal, filtroHijasDe } from '@/lib/categoryParents'
import Product from '@/models/Product'
import { validateCategoryPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

// Busca por id mongo o slug indistintamente
async function findCategory(idOrSlug) {
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    return Category.findById(idOrSlug)
  }
  return Category.findOne({ slug: idOrSlug })
}

// Valida que `parentId` pueda ser padre de `selfId`.
// Reglas: no puede ser uno mismo, debe existir, y no puede ser ya una
// subcategoría (solo admitimos dos niveles). Devuelve un string de error
// o null si todo está bien.
async function validateParents(parentIds = [], selfId = null) {
  if (!parentIds.length) return null
  if (selfId && parentIds.some((id) => String(id) === String(selfId)))
    return 'Una categoría no puede ser su propia categoría padre'
  const padres = await Category.find({ _id: { $in: parentIds } }).select('parent parents').lean()
  if (padres.length !== parentIds.length) return 'Alguna categoría padre no existe'
  if (padres.some((p) => !esPrincipal(p)))
    return 'Una de esas categorías ya es subcategoría. Solo se admiten dos niveles.'
  return null
}

export async function GET(_request, { params }) {
  params = await params
  try {
    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
    return NextResponse.json({ category })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  params = await params
  const bloqueo = await soloStaff()
  if (bloqueo) return bloqueo
  try {
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateCategoryPayload(body)
    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const parentError = await validateParents(value.parents, category._id)
    if (parentError) return NextResponse.json({ error: parentError }, { status: 400 })

    // Si esta categoría ya tiene subcategorías, no puede volverse subcategoría.
    if (value.parents.length) {
      const childCount = await Category.countDocuments(filtroHijasDe([category._id]))
      if (childCount > 0) {
        return NextResponse.json({
          error: `No se puede: "${category.name}" tiene ${childCount} subcategoría(s). Muévelas primero.`,
        }, { status: 409 })
      }
    }

    Object.assign(category, value)
    await category.save()
    return NextResponse.json({ category })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre' }, { status: 409 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  params = await params
  const bloqueo = await soloStaff()
  if (bloqueo) return bloqueo
  try {
    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const childCount = await Category.countDocuments(filtroHijasDe([category._id]))
    if (childCount > 0) {
      return NextResponse.json({
        error: `No se puede eliminar: tiene ${childCount} subcategoría(s). Elimínalas o muévelas primero.`,
      }, { status: 409 })
    }

    const productsCount = await Product.countDocuments({ categories: category._id })
    if (productsCount > 0) {
      return NextResponse.json({
        error: `No se puede eliminar: hay ${productsCount} productos en esta categoría. Muévelos o elimínalos primero.`,
      }, { status: 409 })
    }
    await category.deleteOne()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
