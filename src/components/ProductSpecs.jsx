// ============================================================
// Bloques informativos de la ficha de producto:
//   · Atributos destacados (bullets con palomita)
//   · Ficha técnica completa (specs agrupadas)
//   · Cómo utilizar
//
// Todo viene de los campos `highlights`, `specs` y `usage` que se
// capturan en /admin/productos. Si un producto no los tiene, el
// bloque simplemente no se renderiza.
//
// Server component: es puro display, no necesita estado.
// ============================================================
import Icon from './Icon'

/** Agrupa filas consecutivas de specs por su campo `group`. */
function groupSpecs(specs) {
  const groups = []
  for (const row of specs) {
    const name = (row.group || '').trim()
    const last = groups[groups.length - 1]
    if (last && last.name === name) last.rows.push(row)
    else groups.push({ name, rows: [row] })
  }
  return groups
}

export function ProductHighlights({ highlights }) {
  if (!Array.isArray(highlights) || highlights.length === 0) return null

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 md:p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4">Atributos destacados</h2>
      <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
        {highlights.map((h, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[14px] text-slate-700">
            <svg className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" />
            </svg>
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function ProductSpecsTable({ specs }) {
  if (!Array.isArray(specs) || specs.length === 0) return null
  const groups = groupSpecs(specs)

  return (
    <section className="rounded-2xl border border-slate-200 p-5 md:p-6">
      <h2 className="text-lg font-bold text-slate-900 mb-1">Ficha técnica completa</h2>
      <p className="text-[13px] text-slate-500 mb-5">
        Todos los datos del producto, para que compares sin preguntar.
      </p>

      <div className="space-y-6">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.name && (
              <h3 className="text-[13px] font-bold text-slate-800 mb-2.5">{g.name}</h3>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {g.rows.map((row, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5"
                >
                  <div className="text-[10.5px] uppercase tracking-wide text-slate-400 font-semibold">
                    {row.label}
                  </div>
                  <div className="text-[13.5px] text-slate-800 mt-0.5 break-words">
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProductUsage({ usage }) {
  if (!usage) return null

  return (
    <section className="rounded-2xl border border-slate-200 p-5 md:p-6">
      <h2 className="text-base font-bold text-slate-900 mb-3">Cómo utilizar</h2>
      <div className="flex items-start gap-2.5">
        <svg className="w-4 h-4 text-brand-600 shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" />
        </svg>
        <div>
          <div className="text-[13px] font-semibold text-slate-800">Recomendaciones de uso</div>
          <p className="text-[14px] text-slate-600 leading-relaxed mt-1 whitespace-pre-line">
            {usage}
          </p>
        </div>
      </div>
    </section>
  )
}

/**
 * Bloque de confianza. Reemplaza las cajas de MAHA que hoy no
 * aplican (meses sin intereses, métodos de pago) con cosas que
 * sí son ciertas de CRISTASUR.
 */
export function ProductTrust() {
  const items = [
    { icon: 'tag',    title: 'Precios de mayoreo',  text: 'Entre más piezas, menor precio por unidad.' },
    { icon: 'box',    title: '3 sucursales',        text: 'Mérida Matriz, Tanil y Bacalar.' },
    { icon: 'truck',  title: 'Envío nacional',      text: 'Tu pedido sale de Mérida a donde estés.' },
    { icon: 'shield', title: 'Atención directa',    text: 'Cotiza y resuelve dudas por WhatsApp.' },
  ]

  return (
    <section className="rounded-2xl border border-slate-200 p-5">
      <h2 className="text-base font-bold text-slate-900 mb-4">¿Por qué CRISTASUR?</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
            <span className="w-8 h-8 rounded-lg bg-white border border-slate-200 grid place-items-center text-brand-700 shrink-0">
              <Icon name={it.icon} className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-slate-800">{it.title}</div>
              <div className="text-[12px] text-slate-500 leading-snug mt-0.5">{it.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
