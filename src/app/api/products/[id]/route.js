// ============================================================
// GET    /api/products/:id   - detalle
// PUT    /api/products/:id   - editar (protegido)
// DELETE /api/products/:id   - eliminar (protegido)
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { validateProductPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(_request, { params }) {
  try {
    await dbConnect()
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const product = await Product.findById(params.id)
      .populate('categories', 'name slug icon')
      .lean()
    if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateProductPayload(body)
    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })

    await dbConnect()
    const categoriesCount = await Category.countDocuments({ _id: { $in: value.categories } })
    if (categoriesCount !== value.categories.length) return NextResponse.json({ error: 'Categoría no existe' }, { status: 400 })

    const product = await Product.findByIdAndUpdate(params.id, value, {
      new: true,
      runValidators: true,
    }).populate('categories', 'name slug icon')
    if (!product) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(_request, { params }) {
  try {
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    await dbConnect()
    const res = await Product.findByIdAndDelete(params.id)
    if (!res) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextRe