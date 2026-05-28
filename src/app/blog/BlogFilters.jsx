'use client'
// ============================================================
// Barra de filtros del blog — se envía como form GET a /blog
// ============================================================
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function BlogFilters({ tipo, orden, q }) {
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState(q || '')

  function go({ newTipo, newOrden, newQ }) {
    const t = newTipo  ?? tipo
    const o = newOrden ?? orden
    const s = newQ     ?? search
    const params = new URLSearchParams()
    if (t && t !== 'todos')    params.set('tipo', t)
    if (o && o !== 'reciente') params.set('orden', o)
    if (s)                     params.set('q', s)
    router.push(`${pathname}${params.toString() ? '?' + params.toString() : ''}`)
  }

  function onSearchSubmit(e) {
    e.preventDefault()
    go({ newQ: search })
  }

  const tipoOpts  = [
    { value: 'todos',   label: 'Todos' },
    { value: 'article', label: '📝 Artículos' },
    { value: 'video',   label: '▶ Videos' },
  ]
  const ordenOpts = [
    { value: 'reciente',    label: 'Más recientes' },
    { value: 'vistos',      label: 'Más vistos' },
    { value: 'destacados',  label: '⭐ Destacados' },
  ]

  const btnBase = 'px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap rounded-full border'
  const btnOn   = 'border-slate-900 bg-slate-900 text-white'
  const btnOff  = 'border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-700'

  return (
    <div className="mb-10 space-y-4">
      {/* Búsqueda */}
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar artículos o videos…"
          className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
        >
          Buscar
        </button>
        {(q || tipo !== 'todos' || orden !== 'reciente') && (
          <button
            type="button"
            onClick={() => { setSearch(''); go({ newTipo: 'todos', newOrden: 'reciente', newQ: '' }) }}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 text-sm transition-colors"
          >
            ✕
          </button>
        )}
      </form>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {tipoOpts.map((opt) => (
          <button key={opt.value} type="button" onClick={() => go({ newTipo: opt.value })}
            className={`${btnBase} ${tipo === opt.value ? btnOn : btnOff}`}>
            {opt.label}
          </button>
        ))}
        <span className="w-px bg-slate-100 mx-1 self-stretch hidden sm:block" />
        {ordenOpts.map((opt) => (
          <button key={opt.value} type="button" onClick={() => go({ newOrden: opt.value })}
            className={`${btnBase} ${orden === opt.value ? btnOn : btnOff}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
