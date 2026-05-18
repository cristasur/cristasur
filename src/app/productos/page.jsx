// ============================================================
// /productos - Catálogo con filtros avanzados y búsqueda
// ============================================================
import { Suspense } from 'react'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import ProductGrid from '@/components/ProductGrid'
import ProductFilters from '@/components/ProductFilters'

export const dynamic = 'force-dynamic'

async function loadData({ q, category, featured, minPrice, maxPrice, inStock, onSale, sort }) {
  await dbConnect()
  const now = new Date()
  const filter = {
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  }
  if (featured === '1') filter.featured = true
  if (inStock === '1') filter.stock = { $gt: 0 }
  if (onSale === '1') filter.$expr = { $gt: ['$comparePrice', '$price'] }

  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.price = {}
    if (Number.isFinite(minPrice)) filter.price.$gte = minPrice
    if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice
  }

  if (category) {
    const cat = await Category.findOne({ slug: category }).lean()
    if (cat) filter.categories = cat._id
    else filter.categories = null
  }

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
    ]
  }

  let sortSpec = { featured: -1, createdAt: -1 }
  if (sort === 'priceAsc') sortSpec = { price: 1 }
  else if (sort === 'priceDesc') sortSpec = { price: -1 }
  else if (sort === 'popular')
    sortSpec = { salesCount: -1, whatsappClicks: -1, viewsCount: -1 }

  const [products, categories, total] = await Promise.all([
    Product.find(filter)
      .populate('categories', 'name slug')
      .sort(sortSpec)
      .limit(60)
      .lean(),
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Product.countDocuments(filter),
  ])

  return {
    products: JSON.parse(JSON.stringify(products)),
    categories: JSON.parse(JSON.stringify(categories)),
    total,
  }
}

export default async function CatalogoPage({ searchParams }) {
  const q = (searchParams?.q || '').trim()
  const category = (searchParams?.category || '').trim()
  const featured = searchParams?.featured === '1' ? '1' : ''
  const inStock = searchParams?.inStock === '1' ? '1' : ''
  const onSale = searchParams?.onSale === '1' ? '1' : ''
  const minPrice = Number(searchParams?.minPrice)
  const maxPrice = Number(searchParams?.maxPrice)
  const sort = (searchParams?.sort || 'newest').trim()

  const { products, categories, total } = await loadData({
    q,
    category,
    featured,
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    inStock,
    onSale,
    sort,
  })
  const currentCat = categories.find((c) => c.slug === category)

  let title = 'Catálogo completo'
  if (currentCat) title = currentCat.name
  else if (featured) title = 'Productos destacados'
  else if (onSale) title = 'En oferta'
  else if (q) title = `Resultados para "${q}"`

  const initialFilters = { q, category, featured, inStock, onSale, sort,
    minPrice: searchParams?.minPrice || '', maxPrice: searchParams?.maxPrice || '' }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">{title}</h1>
        <p className="text-slate-500 mt-1">
          {total} {total === 1 ? 'producto' : 'productos'} disponibles
        </p>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="lg:sticky lg:top-24 h-fit">
          <Suspense fallback={<div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 h-96 animate-pulse" />}>
            <ProductFilters categories={categories} initialFilters={initialFilters} />
          </Suspense>
        </aside>
        <div>
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  )
}
