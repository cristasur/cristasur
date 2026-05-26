// ============================================================
// /categoria/[slug] — landing page de cada categoría con SEO real.
// Muestra título, descripción corta, productos publicados y un texto
// largo (seoText) indexable. Si la categoría no existe, 404.
// ============================================================
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import ProductGrid from '@/components/ProductGrid'

export const dynamic = 'force-dynamic'

async function loadCategory(slug) {
  await dbConnect()
  const category = await Category.findOne({ slug, active: true }).lean()
  if (!category) return null
  const now = new Date()
  const products = await Product.find({
    categories: category._id,
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  })
    .populate('categories', 'name slug')
    .populate('brand', 'name slug')
    .sort({ featured: -1, salesCount: -1, viewsCount: -1, createdAt: -1 })
    .limit(60)
    .lean()

  return {
    category: JSON.parse(JSON.stringify(category)),
    products: JSON.parse(JSON.stringify(products)),
  }
}

export async function generateMetadata({ params }) {
  const data = await loadCategory(params.slug)
  if (!data) return { title: 'Categoría no encontrada · CRISTASUR' }
  const { category } = data
  const title =
    category.seoTitle ||
    `${category.name} · CRISTASUR`
  const description =
    category.seoDescription ||
    category.description ||
    `Encuentra ${category.name.toLowerCase()} en CRISTASUR. Precios económicos, mayoreo y entrega en Mérida y Bacalar.`
  return { title, description }
}

export default async function CategoryLanding({ params }) {
  const data = await loadCategory(params.slug)
  if (!data) notFound()
  const { category, products } = data

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <header>
        <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">
          Categoría
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-slate-600 mt-2 max-w-3xl">{category.description}</p>
        )}
        <p className="text-sm text-slate-500 mt-2">
          {products.length} producto{products.length === 1 ? '' : 's'} disponibles
        </p>
      </header>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-500">
          Estamos cargando productos en esta categoría. Contáctanos por WhatsApp para cotizar.
        </div>
      )}

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
