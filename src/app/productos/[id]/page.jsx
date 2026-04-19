// ============================================================
// /productos/:id - Detalle de producto
// ============================================================
import { notFound } from 'next/navigation'
import Link from 'next/link'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import ProductGrid from '@/components/ProductGrid'
import Icon from '@/components/Icon'

export const dynamic = 'force-dynamic'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n)
}

async function loadProduct(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  await dbConnect()
  const product = await Product.findOne({ _id: id, active: true })
    .populate('categories', 'name slug')
    .lean()
  if (!product) return null
  const related = await Product.find({
    _id: { $ne: product._id },
    categories: product.categories?.[0]?._id,
    active: true,
  })
    .populate('categories', 'name slug')
    .limit(4)
    .lean()

  return {
    product: JSON.parse(JSON.stringify(product)),
    related: JSON.parse(JSON.stringify(related)),
  }
}

export default async function ProductDetail({ params }) {
  const data = await loadProduct(params.id)
  if (!data) notFound()
  const { product, related } = data
  const hasDiscount = product.comparePrice && product.comparePrice > product.price

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <nav className="text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-700">Inicio</Link>
        <span className="mx-2">/</span>
        <Link href="/productos" className="hover:text-brand-700">Productos</Link>
        {product.categories?.[0]?.slug && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/categoria/${product.categories[0].slug}`} className="hover:text-brand-700">
              {product.categories[0].name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 aspect-square">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-slate-200">
              <Icon name="box" className="w-28 h-28" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div>
          {product.categories?.[0]?.name && (
            <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">
              {product.categories.map(c => c.name).join(', ')}
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-4xl font-black text-slate-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {product.stock > 0 ? (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Disponible ({product.stock} piezas)
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Bajo pedido
            </div>
          )}

          <div className="mt-6">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold"
            >
              Solicitar cotización
            </Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Hola CRISTASUR, me interesa ${product.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              <Icon name="whatsapp" className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          {product.sku && (
            <div className="mt-6 text-xs text-slate-400">SKU: {product.sku}</div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Productos relacionados</h2>
          <ProductGrid produ