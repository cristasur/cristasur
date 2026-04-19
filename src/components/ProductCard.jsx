// Card de producto reutilizable
import Link from 'next/link'
import Icon from './Icon'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n)
}

export default function ProductCard({ product }) {
  const hasDiscount =
    product.comparePrice && product.comparePrice > product.price
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0

  return (
    <Link
      href={`/productos/${product._id}`}
      className="card-hover group block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover border border-slate-100"
    >
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
          <span className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPct}%
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
      </div>
    </