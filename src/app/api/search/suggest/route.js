// ============================================================
// GET /api/search/suggest?q=<texto>
// Autocompletar de búsqueda: devuelve hasta 6 productos normales,
// hasta 3 categorías y, si el texto coincide con una marca,
// hasta 4 productos de esa marca (sección aparte).
// Público. Optimizado con .select().
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import Brand from '@/models/Brand'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') || '').trim()
    if (q.length < 2) {
      return NextResponse.json({ products: [], categories: [], brands: [] })
    }

    await dbConnect()
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = new RegExp(safe, 'i')

    // Buscar marcas que coincidan con el texto
    const matchingBrands = await Brand.find({ active: true, name: rx })
      .select('name slug _id')
      .limit(3)
      .lean()

    const brandIds = matchingBrands.map((b) => b._id)

    // Buscar productos por nombre/descripción/sku (excluye los de marca coincidente para no duplicar)
    const productFilter = {
      deleted: { $ne: true },
      active: true,
      $or: [{ name: rx }, { description: rx }, { sku: rx }, { color: rx }],
    }

    // Buscar productos de marcas coincidentes (sección aparte)
    const brandProductsPromise = brandIds.length
      ? Product.find({
          deleted: { $ne: true },
          active: true,
          brand: { $in: brandIds },
        })
          .select('name price image stock brand')
          .populate('brand', 'name slug')
          .sort({ featured: -1, salesCount: -1 })
          .limit(4)
          .lean()
      : Promise.resolve([])

    const [products, categories, brandProducts] = await Promise.all([
      Product.find(productFilter)
        .select('name price image stock')
        .sort({ featured: -1, salesCount: -1, whatsappClicks: -1 })
        .limit(6)
        .lean(),
      Category.find({ active: true, name: rx })
        .select('name slug icon')
        .sort({ order: 1 })
        .limit(3)
        .lean(),
      brandProductsPromise,
    ])

    // Quitar de productos generales los que ya aparecen en brandProducts
    const brandProductIds = new Set(brandProducts.map((p) => String(p._id)))
    const filteredProducts = products.filter((p) => !brandProductIds.has(String(p._id)))

    return NextResponse.json({
      products: filteredProducts,
      categories,
      brands: matchingBrands.map((b) => ({
        ...b,
        products: brandProducts.filter(
          (p) => String(p.brand?._id || p.brand) === String(b._id)
        ),
      })),
    })
  } catch (err) {
    console.error('GET /api/search/suggest', err)
    return NextResponse.json({ products: [], categories: [], brands: [] })
  }
}
