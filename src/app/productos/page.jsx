// ============================================================
// /productos - Catálogo con filtros avanzados y búsqueda
// ============================================================
import { Suspense } from 'react'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Brand from '@/models/Brand'
import Material from '@/models/Material'
import ProductGrid from '@/components/ProductGrid'
import ProductFilters from '@/components/ProductFilters'

// Next.js detecta automáticamente el uso de searchParams y hace la página dinámica.
// No se necesita force-dynamic explícito; lo eliminamos para no anclar el comportamiento.

async function loadData({ q, category, featured, minPrice, maxPrice, inStock, onSale, sort, brand, color, material }) {
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

  // Filtro por marca (slug)
  let brandDoc = null
  if (brand) {
    brandDoc = await Brand.findOne({ slug: brand, active: true }).lean()
    if (brandDoc) filter.brand = brandDoc._id
    else filter.brand = null // slug no existe → sin resultados
  }

  // Filtro por material (slug)
  let materialDoc = null
  if (material) {
    materialDoc = await Material.findOne({ slug: material, active: true }).lean()
    if (materialDoc) filter.materials = materialDoc._id
    else filter.materials = null
  }

  // Filtro por color
  if (color) {
    const safeColor = color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    filter.color = { $regex: safeColor, $options: 'i' }
  }

  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Incluir productos cuya marca coincida con el texto
    const matchingBrands = await Brand.find({ name: { $regex: safe, $options: 'i' }, active: true }).select('_id').lean()
    const brandIds = matchingBrands.map((b) => b._id)
    const orClauses = [
      { name: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { color: { $regex: safe, $options: 'i' } },
    ]
    if (brandIds.length) orClauses.push({ brand: { $in: brandIds } })
    filter.$or = orClauses
  }

  // 'newest' (default) respeta el orden manual que asigna el admin.
  // Los destacados siguen al frente solo cuando no hay orden manual definido.
  let sortSpec = { sortOrder: 1, featured: -1, createdAt: -1 }
  if (sort === 'priceAsc') sortSpec = { price: 1 }
  else if (sort === 'priceDesc') sortSpec = { price: -1 }
  else if (sort === 'popular')
    sortSpec = { salesCount: -1, whatsappClicks: -1, viewsCount: -1 }

  const [products, categories, brands, materialsList, total] = await Promise.all([
    Product.find(filter)
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .populate('materials', 'name slug')
      .sort(sortSpec)
      .limit(60)
      .lean(),
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Brand.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Material.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Product.countDocuments(filter),
  ])

  return {
    products: JSON.parse(JSON.stringify(products)),
    categories: JSON.parse(JSON.stringify(categories)),
    brands: JSON.parse(JSON.stringify(brands)),
    materials: JSON.parse(JSON.stringify(materialsList)),
    brandDoc: brandDoc ? JSON.parse(JSON.stringify(brandDoc)) : null,
    materialDoc: materialDoc ? JSON.parse(JSON.stringify(materialDoc)) : null,
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
  const brand    = (searchParams?.brand    || '').trim()
  const color    = (searchParams?.color    || '').trim()
  const material = (searchParams?.material || '').trim()

  const { products, categories, brands, materials, brandDoc, materialDoc, total } = await loadData({
    q,
    category,
    featured,
    minPrice: Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
    inStock,
    onSale,
    sort,
    brand,
    color,
    material,
  })
  const currentCat = categories.find((c) => c.slug === category)

  let title = 'Catálogo completo'
  if (currentCat) title = currentCat.name
  else if (brandDoc) title = `Marca: ${brandDoc.name}`
  else if (materialDoc) title = `Material: ${materialDoc.name}`
  else if (color) title = `Color: ${color}`
  else if (featured) title = 'Productos destacados'
  else if (onSale) title = 'En oferta'
  else if (q) title = `Resultados para "${q}"`

  const initialFilters = {
    q, category, featured, inStock, onSale, sort, brand, color, material,
    minPrice: searchParams?.minPrice || '',
    maxPrice: searchParams?.maxPrice || '',
  }

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
            <ProductFilters
              categories={categories}
              brands={brands}
              materials={materials}
              initialFilters={initialFilters}
            />
          </Suspense>
        </aside>
        <div>
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  )
}
