// ============================================================
// /productos/:id - Detalle de producto
// Incluye Open Graph para que WhatsApp muestre preview con imagen
// al compartir el link del producto.
// ============================================================
import { notFound } from 'next/navigation'
import Link from 'next/link'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import ProductGrid from '@/components/ProductGrid'
import ProductGallery from '@/components/ProductGallery'
import ProductDetailClient from '@/components/ProductDetailClient'
import ReviewList from '@/components/ReviewList'
import RecentlyViewed from '@/components/RecentlyViewed'
import FavoriteButton from '@/components/FavoriteButton'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n)
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

function absoluteImage(image) {
  if (!image) return null
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  return `${siteUrl()}${image.startsWith('/') ? image : `/${image}`}`
}

async function loadProduct(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  await dbConnect()
  const now = new Date()
  const product = await Product.findOne({
    _id: id,
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  })
    .populate('categories', 'name slug')
    .populate('brand', 'name slug')
    .lean()
  if (!product) return null

  // "También compraron" — primero buscamos por coOrders (carritos reales).
  // Si aún no hay datos suficientes, fallback a más vistos de la misma categoría.
  // Populate brand en producto principal
  let alsoBought = []
  const coIds = product.coOrders
    ? Object.entries(product.coOrders)
        // Map vacío vs objeto plano: ambos se serializan a entries
        .sort((a, b) => Number(b[1]) - Number(a[1]))
        .slice(0, 8)
        .map(([id]) => id)
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    : []
  if (coIds.length) {
    alsoBought = await Product.find({
      _id: { $in: coIds, $ne: product._id },
      active: true,
      deleted: { $ne: true },
    })
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .lean()
    // Reordena en el mismo orden que coIds
    const order = new Map(coIds.map((x, i) => [String(x), i]))
    alsoBought.sort((a, b) => (order.get(String(a._id)) ?? 99) - (order.get(String(b._id)) ?? 99))
    alsoBought = alsoBought.slice(0, 4)
  }

  // Related clásico (misma categoría) ordenado por más vistos.
  // Excluimos los que ya están en alsoBought para no repetir.
  const exclude = [product._id, ...alsoBought.map((x) => x._id)]
  const related = await Product.find({
    _id: { $nin: exclude },
    categories: product.categories?.[0]?._id,
    active: true,
    deleted: { $ne: true },
  })
    .populate('categories', 'name slug')
    .populate('brand', 'name slug')
    .sort({ viewsCount: -1, salesCount: -1, createdAt: -1 })
    .limit(4)
    .lean()

  return {
    product: JSON.parse(JSON.stringify(product)),
    related: JSON.parse(JSON.stringify(related)),
    alsoBought: JSON.parse(JSON.stringify(alsoBought)),
  }
}

// Open Graph para previews ricos en WhatsApp, Facebook, Twitter, etc.
export async function generateMetadata({ params }) {
  const data = await loadProduct(params.id)
  if (!data) return { title: 'Producto no encontrado · CRISTASUR' }
  const { product } = data
  const url = `${siteUrl()}/productos/${product._id}`
  const image = absoluteImage(product.image) || `${siteUrl()}/logo.png`
  const description = product.description
    ? product.description.slice(0, 180)
    : 'Precio y disponibilidad en CRISTASUR Mérida.'
  const title = `${product.name} · ${formatPrice(product.price)} · CRISTASUR`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'CRISTASUR',
      images: [{ url: image, width: 1200, height: 1200, alt: product.name }],
      locale: 'es_MX',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function ProductDetail({ params }) {
  const [data, user] = await Promise.all([loadProduct(params.id), getCurrentUser()])
  if (!data) notFound()
  const { product, related, alsoBought } = data
  const isVip = Boolean(user?.wholesaleAccess)
  const hasDiscount = product.comparePrice && product.comparePrice > product.price
  const productUrl = `${siteUrl()}/productos/${product._id}`
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  // Stock agregado: si hay variantes, suma sus stocks; si no, usa el del producto.
  const totalStock = hasVariants
    ? product.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)
    : product.stock || 0

  // JSON-LD Schema.org Product para Google rich snippets
  const productJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.description?.slice(0, 500) || '',
    image: [absoluteImage(product.image), ...(product.gallery || []).map(absoluteImage)].filter(Boolean),
    sku: product.sku || undefined,
    brand: { '@type': 'Brand', name: 'CRISTASUR' },
    category: product.categories?.[0]?.name,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'MXN',
      price: product.price,
      availability:
        totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'CRISTASUR' },
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
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

      <div className="grid md:grid-cols-2 gap-8 md:items-start">
        <ProductGallery
          images={[product.image, ...(product.gallery || [])].filter(Boolean)}
          alt={product.name}
          videoUrl={product.videoUrl || ''}
        />

        <div className="flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {product.categories?.[0]?.name && (
                <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">
                  {product.categories.map((c) => c.name).join(', ')}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mt-2">
                {product.name}
              </h1>
            </div>
            <FavoriteButton productId={product._id} />
          </div>

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

          {totalStock > 0 ? (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Disponible ({totalStock} piezas)
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
              Bajo pedido
            </div>
          )}

          {product.sku && (
            <div className="mt-2 text-[11px] text-slate-400 tracking-wide">
              SKU: {product.sku}
            </div>
          )}

          {product.description && (
            <div className="mt-5 max-h-40 md:max-h-48 overflow-y-auto pr-1">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-[15px]">
                {product.description}
              </p>
            </div>
          )}

          {/* Dimensiones y peso */}
          {(product.weight || product.length || product.width || product.height) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {product.weight && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-slate-400">⚖️</span>
                  <span className="text-slate-500">Peso:</span>
                  <span className="font-semibold text-slate-800">{product.weight} kg</span>
                </div>
              )}
              {product.length && product.width && product.height && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-slate-400">📐</span>
                  <span className="text-slate-500">Medidas:</span>
                  <span className="font-semibold text-slate-800">
                    {product.length} × {product.width} × {product.height} cm
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Variantes + cantidad + añadir al carrito + WhatsApp + compartir */}
          <ProductDetailClient product={product} productUrl={productUrl} isVip={isVip} />
        </div>
      </div>

      {/* Reseñas */}
      <ReviewList productId={product._id} />

      {/* Quienes compraron este, también compraron */}
      {alsoBought?.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-black text-slate-900 mb-6">
            Quienes pidieron éste, también compraron
          </h2>
          <ProductGrid products={alsoBought} />
        </section>
      )}

      {/* Productos relacionados (misma categoría) */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Productos relacionados</h2>
          <ProductGrid products={related} />
        </section>
      )}

      {/* Vistos recientemente (se oculta si no hay historial) */}
      <RecentlyViewed excludeId={product._id} />
    </div>
  )
}
