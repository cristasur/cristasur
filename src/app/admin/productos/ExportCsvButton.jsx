'use client'
// ============================================================
// Botón con menú desplegable para exportar el catálogo a CSV.
// Permite elegir alcance (todos / activos / inactivos / con papelera)
// y opcionalmente filtrar por categoría.
// El download ocurre vía un <a> con la query construida.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/Icon'

export default function ExportCsvButton({ categories = [] }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('all') // 'all' | 'true' | 'false'
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [category, setCategory] = useState('')
  const ref = useRef(null)

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const qs = new URLSearchParams()
  if (active && active !== 'all') qs.set('active', active)
  if (includeDeleted) qs.set('includeDeleted', '1')
  if (category) qs.set('category', category)
  const href = `/api/products/export${qs.toString() ? `?${qs.toString()}` : ''}`

  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `productos-cristasur-${stamp}.csv`

  return (
    <div className="relative" ref={ref}>
      <div className="inline-flex">
        {/* Botón principal: descarga directa con la config actual */}
        <a
          href={href}
          download={filename}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-l-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm"
        >
          <Icon name="download" className="w-4 h-4" />
          Descargar CSV
        </a>
        {/* Caret: abre menú con opciones */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Opciones de exportación"
          aria-expanded={open}
          className="px-2 py-2 rounded-r-lg bg-emerald-600 hover:bg-emerald-700 text-white border-l border-emerald-500"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-30">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Qué exportar
          </div>
          <div className="space-y-1.5 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="active"
                value="all"
                checked={active === 'all'}
                onChange={() => setActive('all')}
              />
              Todos los productos
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="active"
                value="true"
                checked={active === 'true'}
                onChange={() => setActive('true')}
              />
              Sólo activos (publicados)
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="active"
                value="false"
                checked={active === 'false'}
                onChange={() => setActive('false')}
              />
              Sólo inactivos (ocultos)
            </label>
            <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-slate-100 mt-2">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
              />
              Incluir productos en la papelera
            </label>
          </div>

          {categories.length > 0 && (
            <div className="mt-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Categoría (opcional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-300"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.slug || c._id}>
                    {c.icon ? `${c.icon} ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500 leading-tight">
              El archivo incluye la columna <code className="bg-slate-100 px-1 rounded">_id</code>{' '}
              para que puedas editarlo y re-importarlo sin duplicar productos.
            </p>
          </div>

          <a
            href={href}
            download={filename}
            onClick={() => setOpen(false)}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
          >
            <Icon name="download" className="w-4 h-4" />
            Descargar ahora
          </a>
        </div>
      )}
    </div>
  )
}
