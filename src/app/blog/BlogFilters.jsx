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

  const btnBase  = 'px-3 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap'
  const btnOn    = 'bg-brand-600 text-white shadow'
  const btnOff   = 'bg-slate-100 text-slate-600 hover:bg-slate-200'

  return (
    <div className="mb-8 space-y-3">
      {/* Búsqueda */}
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar artículos o videos…"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
        >
          Buscar
        </button>
        {(q || tipo !== 'todos' || orden !== 'reciente') && (
          <button
            type="button"
            onClick={() => { setSearch(''); go({ newTipo: 'todos', newOrden: 'reciente', newQ: '' }) }}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-semibold"
          >
            ✕ Limpiar
          </button>
        )}
      </form>

      {/* Tipo */}
      <div className="flex flex-wrap gap-2">
        {tipoOpts.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => go({ newTipo: opt.value })}
            className={`${btnBase} ${tipo === opt.value ? btnOn : btnOff}`}
          >
            {opt.label}
          </button>
        ))}
        <span className="w-px bg-slate-200 mx-1 self-stretch hidden sm:block" />
        {ordenOpts.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => go({ newOrden: opt.value })}
            className={`${btnBase} ${orden === opt.value ? btnOn : btnOff}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
