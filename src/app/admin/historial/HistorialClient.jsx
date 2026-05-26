'use client'
// ============================================================
// HistorialClient — tabla interactiva del historial de cambios.
// Filtros: acción, editor, búsqueda de producto.
// Cada fila muestra el diff campo por campo sin truncar.
// ============================================================
import { useState, useMemo } from 'react'

const ACTION_CONFIG = {
  create:        { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '✦ Creado',          dot: 'bg-emerald-500' },
  update:        { bg: 'bg-blue-100',    text: 'text-blue-800',    label: '✎ Editado',          dot: 'bg-blue-500'    },
  delete:        { bg: 'bg-rose-100',    text: 'text-rose-700',    label: '✕ Eliminado',        dot: 'bg-rose-500'    },
  restore:       { bg: 'bg-amber-100',   text: 'text-amber-800',   label: '↩ Restaurado',       dot: 'bg-amber-500'   },
  'bulk-update': { bg: 'bg-violet-100',  text: 'text-violet-800',  label: '⚡ Masivo',           dot: 'bg-violet-500'  },
  import:        { bg: 'bg-cyan-100',    text: 'text-cyan-800',    label: '⬆ Importado',        dot: 'bg-cyan-500'    },
  'import-update':{ bg: 'bg-sky-100',   text: 'text-sky-800',     label: '⬆ Importado (edit)', dot: 'bg-sky-500'     },
  duplicate:     { bg: 'bg-orange-100',  text: 'text-orange-800',  label: '⎘ Duplicado',        dot: 'bg-orange-500'  },
  publish:       { bg: 'bg-green-100',   text: 'text-green-800',   label: '◉ Publicado',        dot: 'bg-green-500'   },
  unpublish:     { bg: 'bg-slate-100',   text: 'text-slate-600',   label: '◎ Despublicado',     dot: 'bg-slate-400'   },
}

const SOURCE_LABEL = {
  manual:    'Manual',
  bulk:      'Masivo',
  import:    'CSV Import',
  duplicate: 'Duplicar',
  api:       'API',
}

function ActionBadge({ action }) {
  const cfg = ACTION_CONFIG[action] || ACTION_CONFIG.update
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function DiffRow({ diff, changes }) {
  // Si hay diff estructurado, mostrarlo campo por campo
  if (diff && diff.length > 0) {
    return (
      <div className="space-y-1">
        {diff.map((d, i) => (
          <div key={i} className="flex flex-wrap items-start gap-1 text-xs">
            <span className="font-semibold text-slate-700 shrink-0">{d.field}:</span>
            <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded line-through max-w-[200px] truncate" title={d.from}>
              {d.from}
            </span>
            <span className="text-slate-400">→</span>
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded max-w-[200px] truncate" title={d.to}>
              {d.to}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Fallback: parsear el string legado "field: old → new | field2: ..."
  if (!changes || changes === 'sin cambios relevantes') {
    return <span className="text-slate-400 text-xs italic">sin detalle</span>
  }

  const parts = changes.split(' | ')
  if (parts.length <= 1) {
    // Separador legacy con coma
    const legacy = changes.split(', ')
    return (
      <div className="space-y-0.5">
        {legacy.map((p, i) => {
          const [field, ...rest] = p.split(': ')
          const val = rest.join(': ')
          const [from, to] = val.split(' → ')
          return (
            <div key={i} className="flex flex-wrap items-start gap-1 text-xs">
              <span className="font-semibold text-slate-700 shrink-0">{field}:</span>
              {from && <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded line-through max-w-[180px] truncate" title={from}>{from}</span>}
              {to && <><span className="text-slate-400">→</span><span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded max-w-[180px] truncate" title={to}>{to}</span></>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-0.5">
      {parts.map((p, i) => {
        const [field, ...rest] = p.split(': ')
        const val = rest.join(': ')
        const [from, to] = val.split(' → ')
        return (
          <div key={i} className="flex flex-wrap items-start gap-1 text-xs">
            <span className="font-semibold text-slate-700 shrink-0">{field}:</span>
            {from && <span className="bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded line-through max-w-[180px] truncate" title={from}>{from}</span>}
            {to && <><span className="text-slate-400">→</span><span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded max-w-[180px] truncate" title={to}>{to}</span></>}
          </div>
        )
      })}
    </div>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function HistorialClient({ events, editors }) {
  const [filterAction, setFilterAction] = useState('all')
  const [filterEditor, setFilterEditor] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (filterAction !== 'all' && e.action !== filterAction) return false
      if (filterEditor !== 'all' && e.userEmail !== filterEditor) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.productName.toLowerCase().includes(q) &&
          !e.productSku.toLowerCase().includes(q) &&
          !e.userEmail.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [events, filterAction, filterEditor, search])

  const actionTypes = [...new Set(events.map((e) => e.action))].sort()

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-100 shadow-card rounded-2xl p-4">
        <input
          type="text"
          placeholder="Buscar producto, SKU o editor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="all">Todas las acciones</option>
          {actionTypes.map((a) => (
            <option key={a} value={a}>{ACTION_CONFIG[a]?.label || a}</option>
          ))}
        </select>
        <select
          value={filterEditor}
          onChange={(e) => setFilterEditor(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          <option value="all">Todos los editores</option>
          {editors.map((ed) => (
            <option key={ed} value={ed}>{ed}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} evento{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 whitespace-nowrap">Fecha y hora</th>
                <th className="text-left px-4 py-3">Acción</th>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Editor</th>
                <th className="text-left px-4 py-3 min-w-[300px]">Cambios (campo por campo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((e, i) => (
                <tr key={i} className="hover:bg-slate-50/70 align-top">
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(e.at)}
                    {e.source && e.source !== 'manual' && (
                      <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
                        {SOURCE_LABEL[e.source] || e.source}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ActionBadge action={e.action} />
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/productos/${e.productId}`}
                      className="font-semibold text-slate-800 hover:text-brand-700 text-sm leading-tight block"
                    >
                      {e.productName}
                    </a>
                    {e.productSku && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        SKU: {e.productSku}
                      </div>
                    )}
                    {e.deleted && (
                      <span className="text-[10px] text-rose-500 font-semibold">🗑 en papelera</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700 font-medium text-xs">{e.userEmail}</div>
                    {e.userId && (
                      <div className="text-[10px] text-slate-300 font-mono truncate max-w-[130px] mt-0.5">
                        {e.userId}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DiffRow diff={e.diff} changes={e.changes} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-slate-400">
                    No hay eventos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>Mostrando {filtered.length} de {events.length} eventos</span>
          <span>Máximo 500 eventos más recientes</span>
        </div>
      </div>
    </div>
  )
}
