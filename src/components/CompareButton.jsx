'use client'
import { useCompare } from './CompareProvider'

export default function CompareButton({ product }) {
  const { isInCompare, addToCompare, removeFromCompare, compareItems } = useCompare()
  const inCompare = isInCompare(product._id)
  const isFull = compareItems.length >= 3

  if (!inCompare && isFull) {
    return (
      <button
        disabled
        className="w-full mt-2 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-400 cursor-not-allowed"
      >
        Comparar lleno
      </button>
    )
  }

  return (
    <button
      onClick={() => inCompare ? removeFromCompare(product._id) : addToCompare(product)}
      className={`w-full mt-2 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
        inCompare
          ? 'border-brand-400 bg-brand-50 text-brand-700 hover:bg-brand-100'
          : 'border-slate-200 hover:border-brand-300 text-slate-600 hover:text-brand-700'
      }`}
    >
      {inCompare ? '✓ Comparando' : '＋ Comparar'}
    </button>
  )
}
