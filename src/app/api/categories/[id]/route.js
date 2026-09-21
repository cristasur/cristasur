// ============================================================
// GET    /api/categories/:id  - detalle
// PUT    /api/categories/:id  - editar (protegido)
// DELETE /api/categories/:id  - eliminar (protegido)
// También acepta slug en :id para facilitar lookups públicos.
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
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
async function validateParent(parentId, selfId = null) {
  if (!parentId) return null
  if (selfId && String(parentId) === String(selfId))
    return 'Una categoría no puede ser su propia categoría padre'
  const parent = await Category.findById(parentId).select('parent').lean()
  if (!parent) return 'La categoría padre no existe'
  if (parent.parent)
    return 'Esa categoría ya es una subcategoría. Solo se admiten dos niveles.'
  return null
}

export async function GET(_request, { params }) {
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
  try {
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateCategoryPayload(body)
    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })
    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const parentError = await validateParent(value.parent, category._id)
    if (parentError) return NextResponse.json({ error: parentError }, { status: 400 })

    // Si esta categoría ya tiene subcategorías, no puede volverse subcategoría.
    if (value.parent) {
      const childCount = await Category.countDocuments({ parent: category._id })
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
  try {
    await dbConnect()
    const category = await findCategory(params.id)
    if (!category) return NextResponse.json({ error: 'No encontrada' }, { status: 404 })

    const childCount = await Category.countDocuments({ parent: category._id })
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
