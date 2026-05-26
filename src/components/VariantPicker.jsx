'use client'
// ============================================================
// VariantPicker — selector de variantes.
//
// Modo simple (1 dimensión, label = "Color"):
//   → círculos de color. Al pasar el mouse aparece el nombre.
//     El seleccionado muestra un anillo exterior.
// Modo multi-dim (≥2 dimensiones):
//   → si el grupo se llama "Color": círculos igual que arriba.
//   → otros grupos (Tamaño, Capacidad…): pills de texto.
// ============================================================
import { useMemo, useState, useEffect } from 'react'

// ── Mapa de nombres (español) → color CSS ──────────────────────────────────
const COLOR_MAP = {
  'rojo':          '#e53e3e',
  'rojo oscuro':   '#9b2335',
  'azul':          '#3182ce',
  'azul marino':   '#1a365d',
  'azul claro':    '#63b3ed',
  'azul rey':      '#2244cc',
  'celeste':       '#63b3ed',
  'verde':         '#38a169',
  'verde claro':   '#9ae6b4',
  'verde oscuro':  '#276749',
  'verde militar': '#4a5e2a',
  'amarillo':      '#ecc94b',
  'naranja':       '#ed8936',
  'rosa':          '#f687b3',
  'fucsia':        '#d53f8c',
  'morado':        '#805ad5',
  'lila':          '#b794f4',
  'negro':         '#1a202c',
  'blanco':        '#ffffff',
  'gris':          '#718096',
  'gris claro':    '#cbd5e0',
  'gris oscuro':   '#4a5568',
  'cafe':          '#8B4513',
  'café':          '#8B4513',
  'café oscuro':   '#5C3317',
  'beige':         '#f5f0e8',
  'dorado':        '#d4af37',
  'plateado':      '#c0c0c0',
  'turquesa':      '#38b2ac',
  'transparente':  'transparent',
  'coral':         '#ff6b6b',
  'salmón':        '#fa8072',
  'salmon':        '#fa8072',
  'menta':         '#a8e6cf',
  'lavanda':       '#e6e6fa',
}

function getColorCss(name) {
  if (!name) return '#ccc'
  return COLOR_MAP[name.toLowerCase().trim()] ?? null
}

// ── Swatch circular ────────────────────────────────────────────────────────
function ColorSwatch({ value, active, out, onClick }) {
  const css = getColorCss(value)

  // Si no hay color conocido, caer a pill de texto
  if (!css) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={out ? `${value} — Sin stock` : value}
        className={
          'px-3 py-1.5 rounded-lg border text-sm font-semibold transition ' +
          (active
            ? 'bg-brand-600 border-brand-600 text-white shadow'
            : out
              ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
              : 'bg-white border-slate-300 text-slate-700 hover:border-brand-400')
        }
      >
        {value}
      </button>
    )
  }

  const isLight = ['#ffffff', '#f7fafc', 'transparent', '#f5f0e8', '#cbd5e0', '#e6e6fa', '#a8e6cf', '#9ae6b4'].includes(css)

  return (
    <button
      type="button"
      onClick={onClick}
      title={out ? `${value} — Sin stock` : value}
      aria-label={value}
      className="relative focus:outline-none"
      style={{ padding: 3 }}
    >
      {/* Anillo exterior cuando está activo */}
      <span
        className="absolute inset-0 rounded-full transition-all"
        style={{
          border: active ? '2.5px solid #2563eb' : '2.5px solid transparent',
          borderRadius: '50%',
        }}
      />
      {/* Círculo de color */}
      <span
        className="block rounded-full transition-transform hover:scale-110"
        style={{
          width: 32,
          height: 32,
          background: css === 'transparent'
            ? 'repeating-linear-gradient(45deg,#ccc 0,#ccc 3px,#fff 3px,#fff 8px)'
            : css,
          border: isLight ? '1.5px solid #d1d5db' : '1.5px solid rgba(0,0,0,0.08)',
          opacity: out ? 0.35 : 1,
          position: 'relative',
        }}
      >
        {/* Línea diagonal si sin stock */}
        {out && (
          <span
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ pointerEvents: 'none' }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" style={{ position: 'absolute', top: 0, left: 0 }}>
              <line x1="4" y1="28" x2="28" y2="4" stroke="#ef4444" strokeWidth="2" />
            </svg>
          </span>
        )}
      </span>
    </button>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function VariantPicker({ variants = [], selected, onChange, optionGroups = [] }) {
  const isMultiDim = optionGroups.length >= 2

  // ── Modo multi-dimensional ────────────────────────────────────────────────
  const [selections, setSelections] = useState(() => {
    if (selected?.optionValues) return { ...selected.optionValues }
    return {}
  })

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

  useEffect(() => {
    if (!isMultiDim) return
    onChange?.(matchedVariant)
  }, [matchedVariant]) // eslint-disable-line react-hooks/exhaustive-deps

  function isValuePresent(groupName, value) {
    return variants.some((v) => {
      if (!v.optionValues) return false
      if (v.optionValues[groupName] !== value) return false
      return optionGroups
        .filter((g) => g.name !== groupName)
        .every((g) => !selections[g.name] || v.optionValues[g.name] === selections[g.name])
    })
  }

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

  const isColorGroup = (name) => name?.toLowerCase() === 'color'

  if (isMultiDim) {
    const allChosen = optionGroups.every((g) => selections[g.name])
    return (
      <div className="space-y-4">
        {optionGroups.map((group) => (
          <div key={group.name}>
            <div className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
              {group.name}
              {selections[group.name] && (
                <span className="ml-1.5 font-normal normal-case text-slate-500">
                  — {selections[group.name]}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {(group.values || []).map((value) => {
                const present = isValuePresent(group.name, value)
                const out = present && isValueOutOfStock(group.name, value)
                const active = selections[group.name] === value
                if (isColorGroup(group.name)) {
                  return (
                    <ColorSwatch
                      key={value}
                      value={value}
                      active={active}
                      out={out}
                      onClick={() => setSelections((s) => ({ ...s, [group.name]: value }))}
                    />
                  )
                }
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={out}
                    onClick={() => setSelections((s) => ({ ...s, [group.name]: value }))}
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

        {allChosen && !matchedVariant && (
          <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">
            Esta combinación no está disponible.
          </p>
        )}
        {matchedVariant && (matchedVariant.stock ?? 0) > 0 && (
          <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
            {matchedVariant.stock} disponibles en esta combinación.
          </p>
        )}
      </div>
    )
  }

  // ── Modo simple (1 dimensión) ─────────────────────────────────────────────
  // Agrupamos TODAS las variantes bajo una sola fila "Color" sin importar
  // el label guardado (puede ser 'Color', 'Talla', '', etc. por datos antiguos).
  // Filtramos las que no tienen value para no mostrar swatches vacíos.
  const simpleOpts = useMemo(
    () => (variants || []).filter((v) => v?.value),
    [variants]
  )

  if (!simpleOpts.length) return null

  const activeOpt = simpleOpts.find(
    (v) => selected?.value === v.value
  )

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
        Color
        {activeOpt && (
          <span className="ml-1.5 font-normal normal-case text-slate-500">
            — {activeOpt.value}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {simpleOpts.map((v) => {
          const active = selected?.value === v.value
          const out = (v.stock ?? 0) <= 0
          return (
            <ColorSwatch
              key={`${v.label}-${v.value}`}
              value={v.value}
              active={active}
              out={out}
              onClick={() => onChange?.(v)}
            />
          )
        })}
      </div>
    </div>
  )
}
