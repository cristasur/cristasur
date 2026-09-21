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
import { useMemo } from 'react'

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
// Modelo simétrico: todas las opciones vendibles viven en `variants`.
// El producto padre no representa ninguna. Se agrupan por `label`
// ("Color", "Tamaño"…) y se pinta un selector por grupo.
export default function VariantPicker({ variants = [], selected, onChange }) {
  const isColorGroup = (name) => name?.toLowerCase() === 'color'

  // Agrupa por label. Variantes sin label caen en 'Color' por compatibilidad
  // con datos viejos.
  const groups = useMemo(() => {
    const map = new Map()
    for (const v of variants || []) {
      if (!v?.value) continue
      const lbl = v?.label?.trim() || 'Color'
      if (!map.has(lbl)) map.set(lbl, [])
      map.get(lbl).push(v)
    }
    return Array.from(map.entries()) // [[label, [variants...]], ...]
  }, [variants])

  if (!groups.length) return null

  return (
    <div className="space-y-4">
      {groups.map(([label, opts]) => {
        const isColor = isColorGroup(label)
        const active = opts.find(
          (v) => selected?.label === v.label && selected?.value === v.value
        ) || opts.find((v) => selected?.value === v.value)

        return (
          <div key={label}>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              {label}
              {active && (
                <span className="ml-1.5 font-normal normal-case text-slate-500">
                  — {active.value}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {opts.map((v) => {
                const isActive =
                  (selected?.label === v.label && selected?.value === v.value) ||
                  (!selected?.label && selected?.value === v.value)
                // Sin stock = available:false explícito, o stock 0.
                const out =
                  v.available === false ||
                  (v.stock !== null && v.stock !== undefined && Number(v.stock) <= 0)

                if (isColor) {
                  return (
                    <ColorSwatch
                      key={`${v.label}-${v.value}`}
                      value={v.value}
                      active={isActive}
                      out={out}
                      onClick={() => onChange?.(v)}
                    />
                  )
                }
                // Pills de texto para Tamaño u otras dimensiones
                return (
                  <button
                    key={`${v.label}-${v.value}`}
                    type="button"
                    onClick={() => onChange?.(v)}
                    title={out ? `${v.value} — Sin stock` : v.value}
                    className={
                      'px-3 py-1.5 rounded-lg border text-sm font-semibold transition ' +
                      (isActive
                        ? 'bg-brand-600 border-brand-600 text-white shadow'
                        : out
                          ? 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-brand-400')
                    }
                  >
                    {v.value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
