'use client'
import Link from 'next/link'
import { useCompare } from './CompareProvider'

export default function CompareBar() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare()

  if (compareItems.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl px-4 py-3 animate-slide-up">
      <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
        {/* Product slots */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Array.from({ length: 3 }).map((_, i) => {
            const product = compareItems[i]
            return (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 min-w-[120px] max-w-[180px] ${
                  product
                    ? 'border-brand-200 bg-brand-50'
                    : 'border-dashed border-slate-300 bg-slate-50'
                }`}
              >
                {product ? (
                  <>
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <span className="text-xs font-medium text-slate-800 line-clamp-2 flex-1 min-w-0">
                      {product.name}
                    </span>
                    <button
                      onClick={() => removeFromCompare(product._id)}
                      className="text-slate-400 hover:text-rose-500 text-sm flex-shrink-0"
                      aria-label="Quitar"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 w-full text-center">
                    + producto
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={clearCompare}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Limpiar
          </button>
          {compareItems.length >= 2 ? (
            <Link
              href="/comparar"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors"
            >
              Comparar ahora
            </Link>
          ) : (
            <button
              disabled
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-400 text-sm font-bold cursor-not-allowed"
            >
              Comparar ahora
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
