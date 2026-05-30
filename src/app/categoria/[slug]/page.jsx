// ============================================================
// /categoria/[slug] — landing page de cada categoría con SEO real.
// Muestra título, descripción corta, productos publicados, sidebar de
// filtros (sin la opción "Categoría" porque ya estás dentro de una)
// y un texto largo (seoText) indexable. Si no existe, 404.
// ============================================================
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Brand from '@/models/Brand'
import Material from '@/models/Material'
import ProductGrid from '@/components/ProductGrid'
import ProductFilters from '@/components/ProductFilters'

export const dynamic = 'force-dynamic'

async function loadData(slug, sp) {
  await dbConnect()
  const category = await Category.findOne({ slug, active: true }).lean()
  if (!category) return null

  const q = (sp?.q || '').trim()
  const minPrice = Number(sp?.minPrice)
  const maxPrice = Number(sp?.maxPrice)
  const inStock = sp?.inStock === '1'
  const onSale = sp?.onSale === '1'
  const featured = sp?.featured === '1'
  const sort = (sp?.sort || 'newest').trim()
  const brandSlug = (sp?.brand || '').trim()
  const colorTerm = (sp?.color || '').trim()
  const materialSlug = (sp?.material || '').trim()

  const now = new Date()
  const filter = {
    categories: category._id,
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  }
  if (featured) filter.featured = true
  if (inStock) filter.stock = { $gt: 0 }
  if (onSale) filter.$expr = { $gt: ['$comparePrice', '$price'] }

  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.price = {}
    if (Number.isFinite(minPrice)) filter.price.$gte = minPrice
    if (Number.isFinite(maxPrice)) filter.price.$lte = maxPrice
  }

  let brandDoc = null
  if (brandSlug) {
    brandDoc = await Brand.findOne({ slug: brandSlug, active: true }).lean()
    if (brandDoc) filter.brand = brandDoc._id
    else filter.brand = null
  }

  let materialDoc = null
  if (materialSlug) {
    materialDoc = await Material.findOne({ slug: materialSlug, active: true }).lean()
    if (materialDoc) filter.materials = materialDoc._id
    else filter.materials = null
  }

  if (colorTerm) {
    const safe = colorTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.color = { $regex: safe, $options: 'i' }
  }

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const matchingBrands = await Brand.find({
      name: { $regex: safe, $options: 'i' },
      active: true,
    })
      .select('_id')
      .lean()
    const orClauses = [
      { name: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { color: { $regex: safe, $options: 'i' } },
    ]
    if (matchingBrands.length) {
      orClauses.push({ brand: { $in: matchingBrands.map((b) => b._id) } })
    }
    filter.$or = orClauses
  }

  let sortSpec = { sortOrder: 1, featured: -1, salesCount: -1, createdAt: -1 }
  if (sort === 'priceAsc') sortSpec = { price: 1 }
  else if (sort === 'priceDesc') sortSpec = { price: -1 }
  else if (sort === 'popular')
    sortSpec = { salesCount: -1, whatsappClicks: -1, viewsCount: -1 }

  const [products, brands, materials, total] = await Promise.all([
    Product.find(filter)
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .populate('materials', 'name slug')
      .sort(sortSpec)
      .limit(60)
      .lean(),
    Brand.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Material.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Product.countDocuments(filter),
  ])

  return {
    category: JSON.parse(JSON.stringify(category)),
    products: JSON.parse(JSON.stringify(products)),
    brands: JSON.parse(JSON.stringify(brands)),
    materials: JSON.parse(JSON.stringify(materials)),
    brandDoc: brandDoc ? JSON.parse(JSON.stringify(brandDoc)) : null,
    materialDoc: materialDoc ? JSON.parse(JSON.stringify(materialDoc)) : null,
    total,
  }
}

export async function generateMetadata({ params }) {
  await dbConnect()
  const category = await Category.findOne({ slug: params.slug, active: true }).lean()
  if (!category) return { title: 'Categoría no encontrada · CRISTASUR' }
  const title = category.seoTitle || `${category.name} · CRISTASUR`
  const description =
    category.seoDescription ||
    category.description ||
    `Encuentra ${category.name.toLowerCase()} en CRISTASUR. Precios económicos, mayoreo y entrega en Mérida y Bacalar.`
  return { title, description }
}

export default async function CategoryLanding({ params, searchParams }) {
  const data = await loadData(params.slug, searchParams || {})
  if (!data) notFound()
  const { category, products, brands, materials, brandDoc, materialDoc, total } = data

  // Estado actual de los filtros, para que el sidebar arranque alineado al URL.
  const initialFilters = {
    q: searchParams?.q || '',
    minPrice: searchParams?.minPrice || '',
    maxPrice: searchParams?.maxPrice || '',
    inStock: searchParams?.inStock === '1',
    onSale: searchParams?.onSale === '1',
    featured: searchParams?.featured === '1',
    sort: searchParams?.sort || 'newest',
    brand: searchParams?.brand || '',
    color: searchParams?.color || '',
    material: searchParams?.material || '',
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <header>
        <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">
          Categoría
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">
          {category.name}
          {brandDoc && (
            <span className="ml-2 text-slate-400 font-bold text-2xl">· {brandDoc.name}</span>
          )}
          {materialDoc && (
            <span className="ml-2 text-slate-400 font-bold text-2xl">· {materialDoc.name}</span>
          )}
        </h1>
        {category.description && (
          <p className="text-slate-600 mt-2 max-w-3xl">{category.description}</p>
        )}
        <p className="text-sm text-slate-500 mt-2">
          {total} {total === 1 ? 'producto' : 'productos'} disponibles
        </p>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="lg:sticky lg:top-24 h-fit">
          <Suspense
            fallback={
              <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 h-96 animate-pulse" />
            }
          >
            <ProductFilters
              categories={[]}
              brands={brands}
              materials={materials}
              initialFilters={initialFilters}
              hideCategory
              basePath={`/categoria/${category.slug}`}
            />
          </Suspense>
        </aside>

        <div>
          {products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
              No encontramos productos con esos filtros. Probá aflojar criterios o
              contactanos por WhatsApp para cotizar.
            </div>
          )}
        </div>
      </div>

      {/* SEO long text controlado desde admin */}
      {category.seoText && (
        <article className="bg-white rounded-2xl shadow-card border border-slate-100 p-6 md:p-8 prose prose-slate max-w-none">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Sobre {category.name.toLowerCase()}
          </h2>
          <div className="text-slate-700 leading-relaxed whitespace-pre-line">
            {category.seoText}
          </div>
        </article>
      )}
    </div>
  )
}
