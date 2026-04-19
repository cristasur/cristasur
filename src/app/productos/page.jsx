// ============================================================
// /productos - Catálogo con filtros y búsqueda
// ============================================================
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import ProductGrid from '@/components/ProductGrid'
import CategoryFilter from '@/components/CategoryFilter'

export const dynamic = 'force-dynamic'

async function loadData({ q, category, featured }) {
  await dbConnect()
  const filter = { active: true }
  if (featured === '1') filter.featured = true

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

  const [products, categories, total] = await Promise.all([
    Product.find(filter)
      .populate('categories', 'name slug')
      .sort({ featured: -1, createdAt: -1 })
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
  const q = searchParams?.q?.trim() || ''
  const category = searchParams?.category?.trim() || ''
  const featured = searchParams?.featured === '1' ? '1' : ''

  const { products, categories, total } = await loadData({ q, category, featured })
  const currentCat = categories.find((c) => c.slug === category)

  let title = 'Catálogo completo'
  if (currentCat) title = currentCat.name
  else if (featured) title = 'Productos destacados'
  else if (q) title = `Resultados para "${q}"`

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">{title}</h1>
        <p className="text-slate-500 mt-1">
          {total} {total === 1 ? 'producto' : 'productos'} disponibles
        </p>
      </header>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8">
        <CategoryFilter categories={categories} currentSlug={category} />
        <div>
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
