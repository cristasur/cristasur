'use client'
// ============================================================
// Botón "Categorías" junto al buscador, dentro del header sticky.
//
// Como la barra de categorías se va al hacer scroll, este botón es
// el acceso permanente al catálogo. Abre una lista de categorías
// principales; al posarse sobre una que tiene subcategorías se
// despliega un segundo panel al costado.
// ============================================================
import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { buildCategoryTree } from '@/lib/categoryTree'

export default function CategoriesDropdown({ categories }) {
  const [open, setOpen] = useState(false)
  const [hoverId, setHoverId] = useState(null)
  const wrapRef = useRef(null)

  const tree = useMemo(() => buildCategoryTree(categories), [categories])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
        setHoverId(null)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); setHoverId(null) }
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Cerrar al navegar a otra página
  useEffect(() => {
    if (!open) return
    const close = () => { setOpen(false); setHoverId(null) }
    window.addEventListener('popstate', close)
    return () => window.removeEventListener('popstate', close)
  }, [open])

  if (!tree.length) return null

  const hovered = tree.find((c) => c._id === hoverId)
  const close = () => { setOpen(false); setHoverId(null) }

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
          open
            ? 'bg-brand-50 border-brand-200 text-brand-700'
            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
        }`}
      >
        Categorías
        <svg
          width="14" height="14" viewBox="0 0 20 20" fill="currentColor"
          style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path
            fillRule="evenodd" clipRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 z-50 flex items-start animate-fade-in-up"
          onMouseLeave={() => setHoverId(null)}
        >
          {/* Columna de categorías principales */}
          <div className="w-[268px] bg-white rounded-xl border border-slate-100 shadow-card-hover py-2 max-h-[70vh] overflow-y-auto">
            <Link
              href="/productos"
              onClick={close}
              onMouseEnter={() => setHoverId(null)}
              className="block px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              Todos los productos
            </Link>
            <div className="my-1 border-t border-slate-100" />

            {tree.map((cat) => (
              <div
                key={cat._id}
                onMouseEnter={() => setHoverId(cat.children.length ? cat._id : null)}
              >
                <Link
                  href={`/categoria/${cat.slug}`}
                  onClick={close}
                  className={`flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors ${
                    hoverId === cat._id
                      ? 'bg-slate-50 text-slate-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  {cat.children.length > 0 && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 text-slate-300">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </Link>
              </div>
            ))}
          </div>

          {/* Panel lateral con las subcategorías de la que tenga el mouse */}
          {hovered && hovered.children.length > 0 && (
            <div className="w-[268px] ml-1.5 bg-white rounded-xl border border-slate-100 shadow-card-hover py-2 max-h-[70vh] overflow-y-auto">
              <div className="px-4 py-2 text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                {hovered.name}
              </div>
              {hovered.children.map((sub) => (
                <Link
                  key={sub._id}
                  href={`/categoria/${sub.slug}`}
                  onClick={close}
                  className="block px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
