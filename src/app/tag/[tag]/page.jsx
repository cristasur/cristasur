// ============================================================
// /tag/[tag] — landing dinámica para cualquier tag asignado a productos.
// Útil para campañas estacionales (/tag/navidad, /tag/eco, etc.)
// ============================================================
import { notFound } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import ProductGrid from '@/components/ProductGrid'

export const dynamic = 'force-dynamic'

async function loadByTag(tag) {
  await dbConnect()
  const cleaned = String(tag || '').toLowerCase().trim()
  if (!cleaned) return null
  const now = new Date()
  const products = await Product.find({
    tags: cleaned,
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  })
    .populate('categories', 'name slug')
    .populate('brand', 'name slug')
    .sort({ featured: -1, viewsCount: -1, createdAt: -1 })
    .limit(60)
    .lean()
  return {
    tag: cleaned,
    products: JSON.parse(JSON.stringify(products)),
  }
}

export async function generateMetadata({ params }) {
  const data = await loadByTag(params.tag)
  if (!data || !data.products.length) {
    return { title: 'Etiqueta no encontrada · CRISTASUR' }
  }
  const pretty = data.tag.replace(/-/g, ' ')
  return {
    title: `${pretty} · CRISTASUR`,
    description: `Productos etiquetados con "${pretty}" en CRISTASUR. Mérida y Bacalar.`,
  }
}

export default async function TagLanding({ params }) {
  const data = await loadByTag(params.tag)
  if (!data) notFound()
  if (!data.products.length) notFound()

  const pretty = data.tag.replace(/-/g, ' ')

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      <header>
        <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">
          Etiqueta
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-1 capitalize">
          {pretty}
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          {data.products.length} producto{data.products.length === 1 ? '' : 's'}
        </p>
      </header>

      <ProductGrid products={data.products} />
    </div>
  )
}
