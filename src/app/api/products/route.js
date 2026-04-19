// ============================================================
// GET  /api/products    - lista pública con filtros
//   Query params:
//     ?category=<id|slug>   filtra por categoría
//     ?q=<texto>            búsqueda por nombre/descripción
//     ?featured=1           solo destacados
//     ?limit=20&skip=0      paginación
//     ?all=1                incluye inactivos (admin)
// POST /api/products    - crea (protegido)
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { validateProductPayload } from '@/lib/validation'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const categoryParam = (url.searchParams.get('category') || '').trim()
    const featured = url.searchParams.get('featured') === '1'
    const includeInactive = url.searchParams.get('all') === '1'
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 48, 1), 100)
    const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0)

    const filter = {}
    if (!includeInactive) filter.active = true
    if (featured) filter.featured = true

    if (categoryParam) {
      if (mongoose.Types.ObjectId.isValid(categoryParam)) {
        filter.categories = categoryParam
      } else {
        // es slug → resolvemos a ObjectId
        const cat = await Category.findOne({ slug: categoryParam }).select('_id').lean()
        if (!cat) return NextResponse.json({ products: [], total: 0 })
        filter.categories = cat._id
      }
    }

    if (q) {
      // Búsqueda case-insensitive por nombre o descripción.
      // Escapamos la query para evitar inyección de regex.
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
      ]
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categories', 'name slug icon')
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ])

    return NextResponse.json({ products, total, limit, skip })
  } catch (err) {
    console.error('GET /api/products', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { errors, value } = validateProductPayload(body)
    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 400 })

    await dbConnect()
    // Confirmamos que todas las categorías existen
    const categoriesCount = await Category.countDocuments({ _id: { $in: value.categories } })
    if (categoriesCount !== value.categories.length) {
      return NextResponse.json({ error: 'Alguna categoría no existe' }, { status: 400 })
    }

    const product = await Product.create(value)
    await product.populate('categories', 'name slug icon')
    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'SKU duplicado' }, { status: 409 })
    }
    console.error('POST /api/products', err)