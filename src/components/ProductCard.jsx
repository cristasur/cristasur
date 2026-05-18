// Card de producto reutilizable (Server Component que delega la
// interacción al cliente mediante AddToCartButton y FavoriteButton).
import Link from 'next/link'
import Icon from './Icon'
import AddToCartButton from './AddToCartButton'
import FavoriteButton from './FavoriteButton'
import CompareButton from './CompareButton'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

export default function ProductCard({ product }) {
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0
  const href = `/productos/${product._id}`
  const outOfStock = product.stock === 0

  return (
    <article className="card-hover group relative bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover border border-slate-100 flex flex-col">
      <Link href={href} className="block">
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-slate-300">
              <Icon name="box" className="w-16 h-16" strokeWidth={1.5} />
            </div>
          )}
          {product.featured && (
            <span className="absolute top-3 left-3 bg-accent-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full">
              Destacado
            </span>
          )}
          {hasDiscount && (
            <span className="absolute top-3 left-3 mt-7 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discountPct}%
            </span>
          )}
          {outOfStock && (
            <span className="absolute inset-0 bg-black/40 grid place-items-center">
              <span className="bg-white/95 text-slate-900 text-xs font-bold uppercase px-3 py-1 rounded-full">
                Sin stock
              </span>
            </span>
          )}
        </div>
        <div className="p-4">
          {product.categories?.[0]?.name && (
            <div className="text-[11px] uppercase tracking-wider text-brand-600 font-semibold mb-1">
              {product.categories[0].name}
            </div>
          )}
          <h3 className="font-semibold text-slate-900 line-clamp-2 text-[15px] leading-snug min-h-[2.6em]">
            {product.name}
          </h3>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
          {product.wholesalePrice && product.wholesaleMinQty && (
            <div className="mt-1.5 space-y-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                Mayoreo: {formatPrice(product.wholesalePrice)} · desde {product.wholesaleMinQty} pzs
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                Ahorras {formatPrice((product.price - product.wholesalePrice) * product.wholesaleMinQty)} comprando {product.wholesaleMinQty}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Favorito (se superpone, fuera del Link) */}
      <div className="absolute top-3 right-3">
        <FavoriteButton productId={product._id} />
      </div>

      <div className="px-4 pb-4">
        <AddToCartButton
          product={product}
          compact
          className="w-full"
          label={outOfStock ? 'Sin stock' : 'Añadir al carrito'}
        />
        <CompareButton product={product} />
      </div>
    </article>
  )
}
