'use client'
// ============================================================
// VariantPicker — selector de variantes.
//
// Modo simple (1 dimensión): label + value  → mismo comportamiento de siempre.
// Modo multi-dim (≥2 dimensiones): cada grupo de opciones se elige por separado.
//   El padre recibe onChange(variant) con la variante exacta que coincide con
//   todas las selecciones, o onChange(null) cuando aún no se ha elegido todo.
// ============================================================
import { useMemo, useState, useEffect } from 'react'

export default function VariantPicker({ variants = [], selected, onChange, optionGroups = [] }) {
  const isMultiDim = optionGroups.length >= 2

  // ── Modo multi-dimensional ─────────────────────────────────────────────────
  const [selections, setSelections] = useState(() => {
    // Pre-seleccionar desde la variante que venga como `selected`
    if (selected?.optionValues) return { ...selected.optionValues }
    return {}
  })

  // Variante que coincide con todas las selecciones actuales
  const matchedVariant = useMemo(() => {
    if (!isMultiDim) return null
    const allChosen = optionGroups.every((g) => selections[g.name])
    if (!allChosen) return null
    return (
      variants.find(
        (v) =>
          v.optionValues &&
          optionGroups.every((g) => v.optionValues[g.name] === selections[g.name])
      ) || null
    )
  }, [selections, variants, optionGroups, isMultiDim])

  // Notificar al padre cada vez que cambia la variante encontrada
  useEffect(() => {
    if (!isMultiDim) return
    onChange?.(matchedVariant)
  }, [matchedVariant]) // eslint-disable-line react-hooks/exhaustive-deps

  // ¿Esta combinación parcial tiene alguna variante disponible (con stock o sin)?
  function isValuePresent(groupName, value) {
    return variants.some((v) => {
      if (!v.optionValues) return false
      if (v.optionValues[groupName] !== value) return false
      // Respetar selecciones previas de otros grupos
      return optionGroups
        .filter((g) => g.name !== groupName)
        .every((g) => !selections[g.name] || v.optionValues[g.name] === selections[g.name])
    })
  }

  // ¿TODAS las variantes que coinciden con esta combinación parcial están sin stock?
  function isValueOutOfStock(groupName, value) {
    const matching = variants.filter((v) => {
      if (!v.optionValues) return false
      if (v.optionValues[groupName] !== value) return false
      return optionGroups
        .filter((g) => g.name !== groupName)
        .every((g) => !selections[g.name] || v.optionValues[g.name] === selections[g.name])
    })
    if (!matching.length) return false
    return matching.every((v) => (v.stock ?? 0) <= 0)
  }

  if (isMultiDim) {
    const allChosen = optionGroups.every((g) => selections[g.name])
    return (
      <div className="space-y-4">
        {optionGroups.map((group) => (
          <div key={group.name}>
            <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
              {group.name}
              {selections[group.name] && (
                <span className="font-normal text-brand-700">: {selections[group.name]}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(group.values || []).map((value) => {
                const present = isValuePresent(group.name, value)
                const out = present && isValueOutOfStock(group.name, value)
                const active = selections[group.name] === value
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={out}
                    onClick={() =>
                      setSelections((s) => ({ ...s, [group.name]: value }))
                    }
                    className={
                      'px-3 py-1.5 rounded-lg border text-sm font-semibold transition ' +
                      (out
                        ? 'bg-slate-50 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                        : active
                          ? 'bg-brand-600 border-brand-600 text-white shadow'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-brand-400')
                    }
                    title={out ? 'Sin stock en esta combinación' : value}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Mensaje cuando se eligió todo pero no hay combinación */}
        {allChosen && !matchedVariant && (
          <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
            Esta combinación no está disponible.
          </p>
        )}

        {/* Indicador de stock de la combinación elegida */}
        {matchedVariant && (matchedVariant.stock ?? 0) > 0 && (
          <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
            {matchedVariant.stock} disponibles en esta combinación.
          </p>
        )}
      </div>
    )
  }

  // ── Modo simple (1 dimensión, comportamiento original) ─────────────────────
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
