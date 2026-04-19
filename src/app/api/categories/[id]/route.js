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

    const productsCount = await Product.countDocuments({ category: category._id })
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
