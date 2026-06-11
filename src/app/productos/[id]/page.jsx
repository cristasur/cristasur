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
import User from '@/models/User'

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
    .populate('materials', 'name')
    .populate('relatedProducts', '_id name image price')
    .lean()
  if (!product) return null

  // Productos relacionados vinculados manualmente (populate)
  const manualRelated = product.relatedProducts?.length > 0
    ? await Product.find({
        _id: { $in: product.relatedProducts },
        active: true,
        deleted: { $ne: true },
      })
        .select('_id name image price')
        .lean()
    : []

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

  // "También disponible en" — fusión de:
  //   1. Productos vinculados manualmente (relatedProducts)
  //   2. Productos con la misma etiqueta (tag) — complementa la selección manual
  // Los manuales van primero; los de etiqueta se deduplicanSame.
  const tagFamily = product.tags?.length > 0
    ? await Product.find({
        _id: { $ne: product._id },
        tags: { $in: product.tags },
        active: true,
        deleted: { $ne: true },
      })
        .select('_id name image price slug')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean()
    : []

  const manualIds = new Set(manualRelated.map((p) => String(p._id)))
  const sameFamilyAll = [
    ...manualRelated,
    ...tagFamily.filter((p) => !manualIds.has(String(p._id))),
  ]
  // Mostrar hasta 6 al azar para que cada visita sea fresca cuando hay muchos
  const sameFamily = sameFamilyAll.length <= 6
    ? sameFamilyAll
    : sameFamilyAll
        .map((p) => ({ p, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .slice(0, 6)
        .map(({ p }) => p)

  // Related clásico (misma categoría) — excluye alsoBought y sameFamily para no repetir.
  const excludeIds = [product._id, ...alsoBought.map((x) => x._id), ...sameFamily.map((x) => x._id)]
  const related = await Product.find({
    _id: { $nin: excludeIds },
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
    sameFamily: JSON.parse(JSON.stringify(sameFamily)),
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

export default async function ProductDetail({ params, searchParams }) {
  const [data, session] = await Promise.all([loadProduct(params.id), getCurrentUser()])
  if (!data) notFound()
  const { product, sameFamily, related, alsoBought } = data
  // Consultar DB directo para el VIP: el JWT puede estar desactualizado si el admin
  // revocó el acceso mayoreo sin que el usuario haya vuelto a iniciar sesión.
  let isVip = false
  if (session?.sub) {
    try {
      await dbConnect()
      const freshUser = await User.findById(session.sub).select('wholesaleAccess').lean()
      isVip = Boolean(freshUser?.wholesaleAccess)
    } catch {}
  }
  const hasDiscount = product.comparePrice && product.comparePrice > product.price
  const productUrl = `${siteUrl()}/productos/${product._id}`
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  // null = ilimitado (sin número), 0 = sin stock, >0 = muestra cantidad
  // Para productos sin variantes: null = ilimitado
  // Para productos con variantes: si alguna tiene stock null, hay stock disponible
  const stockUnlimited =
    (!hasVariants && product.stock === null) ||
    (hasVariants && product.variants.some((v) => v.stock === null))
  const totalStock = hasVariants
    ? product.variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0)
    : product.stock ?? 0

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
        stockUnlimited || totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'CRISTASUR' },
    },
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-10 overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <nav className="text-xs sm:text-sm text-slate-500 mb-4 md:mb-6 truncate">
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

      <div className="grid md:grid-cols-2 gap-4 md:gap-8 md:items-start min-w-0">
        <div className="min-w-0 w-full">
          <ProductGallery
            images={[product.image, ...(product.gallery || [])].filter(Boolean)}
            alt={product.name}
            videoUrl={product.videoUrl || ''}
          />
        </div>

        <div className="flex flex-col min-w-0 overflow-x-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {product.categories?.[0]?.name && (
                <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">
                  {product.categories.map((c) => c.name).join(', ')}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-1.5 uppercase">
                {product.name}
              </h1>
            </div>
            <FavoriteButton productId={product._id} />
          </div>

          <div className="mt-3 md:mt-4 flex items-baseline gap-3">
            <span className="text-3xl md:text-4xl font-black text-slate-900">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-slate-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {stockUnlimited || totalStock > 0 ? (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Disponible{!stockUnlimited && ` (${totalStock} piezas)`}
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
              Sin stock
            </div>
          )}

          {product.sku && (
            <div className="mt-2 text-[11px] text-slate-400 tracking-wide">
              SKU: {product.sku}
            </div>
          )}

          {product.description && (
            <div className="mt-4 max-h-36 md:max-h-48 overflow-y-auto pr-1">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm md:text-[15px]">
                {product.description}
              </p>
            </div>
          )}

          {/* Variantes + cantidad + añadir al carrito + WhatsApp + compartir */}
          <ProductDetailClient product={product} productUrl={productUrl} isVip={isVip} initialColor={(searchParams?.color || '').trim()} />
        </div>
      </div>

      {/* ── Especificaciones técnicas (estilo Amazon) ── */}
      {(product.capacity || product.weight || product.length || product.width || product.height ||
        product.boxLength || product.boxWidth || product.boxHeight || product.boxWeight ||
        product.materials?.length > 0 || product.materialText || product.resistencia ||
        product.brand?.name) && (
        <section className="mt-10 border-t border-slate-100 pt-8">
          <div className="md:w-1/2">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Detalles del producto</h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-sm">
              {product.brand?.name && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Marca</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">{product.brand.name}</div>
                </div>
              )}
              {(product.materials?.length > 0 || product.materialText) && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Material</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">
                    {[
                      ...(product.materials?.map(m => m.name).filter(Boolean) || []),
                      ...(product.materialText ? [product.materialText] : [])
                    ].join(', ')}
                  </div>
                </div>
              )}
              {product.capacity && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Capacidad</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">{product.capacity} {product.capacityUnit || 'L'}</div>
                </div>
              )}
              {product.weight && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Peso</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">{product.weight} kg</div>
                </div>
              )}
              {product.length && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Largo</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">{product.length} cm</div>
                </div>
              )}
              {product.width && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Ancho</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">{product.width} cm</div>
                </div>
              )}
              {product.height && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Alto</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">{product.height} cm</div>
                </div>
              )}
              {(product.boxLength || product.boxWidth || product.boxHeight) && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Caja de envío</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">
                    {[product.boxLength, product.boxWidth, product.boxHeight].filter(Boolean).join(' × ')} cm
                  </div>
                </div>
              )}
              {product.boxWeight && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Peso c/ caja</div>
                  <div className="flex-1 px-4 py-3 text-slate-800">{product.boxWeight} kg</div>
                </div>
              )}
              {product.resistencia && (
                <div className="flex border-b border-slate-100">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">Resistencia</div>
                  <div className="flex-1 px-4 py-3 text-slate-800 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      product.resistencia === 'alta' ? 'bg-emerald-500' :
                      product.resistencia === 'media' ? 'bg-amber-400' : 'bg-red-400'
                    }`} />
                    <span className="capitalize">{product.resistencia}</span>
                  </div>
                </div>
              )}
              {product.sku && (
                <div className="flex">
                  <div className="w-40 shrink-0 bg-slate-50 px-4 py-3 font-semibold text-slate-700">SKU</div>
                  <div className="flex-1 px-4 py-3 text-slate-500 font-mono text-xs tracking-wide">{product.sku}</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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

      {/* Productos relacionados — etiquetas (random) + categoría como fallback */}
      {(() => {
        const seenIds = new Set(alsoBought.map((p) => String(p._id)))
        // sameFamily ya viene aleatorio; completar con related si hacen falta
        const pool = [
          ...sameFamily.filter((p) => !seenIds.has(String(p._id))),
          ...related.filter((p) => !seenIds.has(String(p._id)) && !sameFamily.find((s) => String(s._id) === String(p._id))),
        ].slice(0, 8)
        if (!pool.length) return null
        return (
          <section className="mt-16">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Productos relacionados</h2>
            <ProductGrid products={pool} />
          </section>
        )
      })()}

      {/* Vistos recientemente (se oculta si no hay historial) */}
      <RecentlyViewed excludeId={product._id} />
    </div>
  )
}
