// ============================================================
// GET /api/products/export
//   ?includeDeleted=1  incluye soft-deleted
//   ?category=<id|slug> filtra por categoría
//   ?active=all|true|false
// Devuelve un CSV (UTF-8 con BOM) con las columnas estándar
// para descargar/respaldar todos los productos.
// ============================================================
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { toCSV, PRODUCT_EXPORT_COLUMNS } from '@/lib/csv'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request) {
  try {
    await dbConnect()
    const url = new URL(request.url)
    const includeDeleted = url.searchParams.get('includeDeleted') === '1'
    const categoryParam = (url.searchParams.get('category') || '').trim()
    const activeParam = (url.searchParams.get('active') || 'all').trim()

    const filter = {}
    if (!includeDeleted) filter.deleted = { $ne: true }
    if (activeParam === 'true') filter.active = true
    else if (activeParam === 'false') filter.active = false

    if (categoryParam) {
      if (mongoose.Types.ObjectId.isValid(categoryParam)) {
        filter.categories = categoryParam
      } else {
        const cat = await Category.findOne({ slug: categoryParam }).select('_id').lean()
        if (cat) filter.categories = cat._id
      }
    }

    const products = await Product.find(filter)
      .populate('categories', 'name slug')
      .sort({ createdAt: -1 })
      .lean()

    const rows = products.map((p) => ({
      _id: String(p._id),
      name: p.name || '',
      description: p.description || '',
      price: p.price ?? 0,
      comparePrice: p.comparePrice ?? '',
      wholesalePrice: p.wholesalePrice ?? '',
      wholesaleMinQty: p.wholesaleMinQty ?? '',
      bulkPrice: p.hundredPrice ?? '',
      bulkMinQty: p.hundredMinQty ?? '',
      status: p.status || 'published',
      stock: p.stock ?? 0,
      sku: p.sku || '',
      featured: p.featured ? 'true' : 'false',
      active: p.active ? 'true' : 'false',
      image: p.image || '',
      gallery: Array.isArray(p.gallery) ? p.gallery.join('|') : '',
      categories: Array.isArray(p.categories)
        ? p.categories.map((c) => c?.name || '').filter(Boolean).join('|')
        : '',
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : '',
      updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : '',
    }))

    const csv = toCSV(rows, PRODUCT_EXPORT_COLUMNS)
    const stamp = new Date().toISOString().slice(0, 10)

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="productos-cristasur-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('GET /api/products/export', err)
    return new Response(
      JSON.stringify({ error: 'Error al exportar' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
