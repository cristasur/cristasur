'use client'
// Selector de variantes. Agrupa por label (Talla, Color, etc.).
// Para simplicidad, asumimos que cada variante es única por label+value.
// Pasamos la variante seleccionada al padre vía onChange.
import { useMemo } from 'react'

export default function VariantPicker({ variants = [], selected, onChange }) {
  const groups = useMemo(() => {
    const map = new Map()
    for (const v of variants || []) {
      if (!v?.label || !v?.value) continue
      if (!map.has(v.label)) map.set(v.label, [])
      map.get(v.label).push(v)
    }
    return Array.from(map.entries())
  }, [variants])

  if (!groups.length) return null

  return (
    <div className="space-y-3">
      {groups.map(([label, opts]) => (
        <div key={label}>
          <div className="text-xs font-semibold text-slate-600 mb-1">{label}</div>
          <div className="flex flex-wrap gap-2">
            {opts.map((v) => {
              const active =
                selected?.label === v.label && selected?.value === v.value
              const out = (v.stock ?? 0) <= 0
              return (
                <button
                  key={`${v.label}-${v.value}`}
                  type="button"
                  disabled={out}
                  onClick={() => onChange?.(v)}
                  className={
                    'px-3 py-1.5 rounded-lg border text-sm font-semibold transition ' +
                    (out
                      ? 'bg-slate-50 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                      : active
                        ? 'bg-brand-600 border-brand-600 text-white shadow'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-brand-400')
                  }
                  title={out ? 'Sin stock' : `${label}: ${v.value}`}
                >
                  {v.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
