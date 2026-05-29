// ============================================================
// GET  /api/products   (público, por defecto excluye borrados)
//   ?category=<id|slug>
//   ?q=<texto>
//   ?featured=1
//   ?minPrice=100&maxPrice=500
//   ?inStock=1            solo con stock > 0
//   ?onSale=1             solo con comparePrice > price
//   ?sort=newest|priceAsc|priceDesc|popular
//   ?limit=48&skip=0
//   ?all=1                incluye inactivos (admin)
//   ?includeDeleted=1     incluye soft-deleted (admin)
//   ?deletedOnly=1        solo soft-deleted (papelera)
//   ?brand=<slug>         filtrar por marca
//   ?color=<texto>        filtrar por color (regex insensible)
// POST /api/products   (protegido - admin)
// ============================================================
import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import Brand from '@/models/Brand'
import Material from '@/models/Material'
import { validateProductPayload } from '@/lib/validation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    const categoryParam = (url.searchParams.get('category') || '').trim()
    const featured = url.searchParams.get('featured') === '1'
    const includeInactive = url.searchParams.get('all') === '1'
    const includeDeleted = url.searchParams.get('includeDeleted') === '1'
    const deletedOnly = url.searchParams.get('deletedOnly') === '1'
    const inStock = url.searchParams.get('inStock') === '1'
    const onSale = url.searchParams.get('onSale') === '1'
    const minPrice = Number(url.searchParams.get('minPrice')) || null
    const maxPrice = Number(url.searchParams.get('maxPrice')) || null
    const sortParam = url.searchParams.get('sort') || 'newest'
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 48, 1), 100)
    const skip = Math.max(Number(url.searchParams.get('skip')) || 0, 0)
    const brandParam    = (url.searchParams.get('brand')    || '').trim()
    const colorParam    = (url.searchParams.get('color')    || '').trim()
    const materialParam = (url.searchParams.get('material') || '').trim()

    const needsAdmin = includeInactive || includeDeleted || deletedOnly
    if (needsAdmin) {
      const user = await getCurrentUser()
      if (!user || !['admin', 'editor'].includes(user.role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
    }

    const filter = {}
    if (deletedOnly) filter.deleted = true
    else if (!includeDeleted) filter.deleted = { $ne: true }

    if (!includeInactive) filter.active = true
    if (featured) filter.featured = true
    if (inStock) filter.stock = { $gt: 0 }

    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      filter.price = {}
      if (Number.isFinite(minPrice)) filter.price.$gte = minPrice
      if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice
    }

    if (onSale) {
      filter.$expr = { $gt: ['$comparePrice', '$price'] }
    }

    if (categoryParam) {
      if (mongoose.Types.ObjectId.isValid(categoryParam)) {
        filter.categories = categoryParam
      } else {
        const cat = await Category.findOne({ slug: categoryParam }).select('_id').lean()
        if (!cat) return NextResponse.json({ products: [], total: 0 })
        filter.categories = cat._id
      }
    }

    // Filtro por marca (slug)
    if (brandParam) {
      const brandDoc = await Brand.findOne({ slug: brandParam, active: true }).select('_id').lean()
      if (!brandDoc) return NextResponse.json({ products: [], total: 0 })
      filter.brand = brandDoc._id
    }

    // Filtro por material (slug)
    if (materialParam) {
      const matDoc = await Material.findOne({ slug: materialParam, active: true }).select('_id').lean()
      if (!matDoc) return NextResponse.json({ products: [], total: 0 })
      filter.materials = matDoc._id
    }

    // Filtro por color — busca en color del producto, variantes simples (value) y variantes multi-dim (optionValues.Color)
    if (colorParam) {
      const safeColor = colorParam.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const colorReg = { $regex: safeColor, $options: 'i' }
      filter.$and = [
        ...(filter.$and || []),
        {
          $or: [
            { color: colorReg },
            { 'variants.value': colorReg },
            { 'variants.optionValues.Color': colorReg },
          ],
        },
      ]
    }

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Buscar marcas que coincidan con el texto para incluir sus productos
      const matchingBrands = await Brand.find({ name: { $regex: safe, $options: 'i' }, active: true }).select('_id').lean()
      const brandIds = matchingBrands.map((b) => b._id)

      const orClauses = [
        { name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { color: { $regex: safe, $options: 'i' } },
        { sku: { $regex: safe, $options: 'i' } },
      ]
      if (brandIds.length) orClauses.push({ brand: { $in: brandIds } })

      filter.$or = orClauses
    }

    let sort = { featured: -1, createdAt: -1 }
    if (sortParam === 'priceAsc') sort = { price: 1 }
    else if (sortParam === 'priceDesc') sort = { price: -1 }
    else if (sortParam === 'popular') sort = { salesCount: -1, whatsappClicks: -1, viewsCount: -1 }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categories', 'name slug icon')
        .populate('brand', 'name slug')
        .populate('materials', 'name slug')
        .sort(sort)
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
    if (errors.length)
      return NextResponse.json({ error: errors.join(', ') }, { status: 400 })

    await dbConnect()
    const categoriesCount = await Category.countDocuments({
      _id: { $in: value.categories },
    })
    if (categoriesCount !== value.categories.length) {
      return NextResponse.json({ error: 'Alguna categoría no existe' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const product = await Product.create({
      ...value,
      createdBy: user?.sub,
      updatedBy: user?.sub,
      editHistory: [
        {
          userId: user?.sub,
          userEmail: user?.email,
          action: 'create',
          changes: `Creado con precio ${value.price} y ${value.categories.length} categoría(s)`,
        },
      ],
    })
    await product.populate('categories', 'name slug icon')
    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ error: 'SKU duplicado' }, { status: 409 })
    }
    console.error('POST /api/products', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
