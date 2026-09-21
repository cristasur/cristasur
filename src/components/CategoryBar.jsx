'use client'
// ============================================================
// Barra de categorías — fila de enlaces debajo del header.
//
// NO es sticky: se queda en su lugar y desaparece al bajar, como
// en MAHA. Cuando ya no se ve, el botón "Categorías" del header
// (CategoriesDropdown) toma el relevo.
//
// Al pasar el mouse sobre una categoría con subcategorías se abre
// un panel ancho: subcategorías a la izquierda y una vista previa
// de productos a la derecha, cargada bajo demanda y cacheada.
// ============================================================
import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { buildCategoryTree } from '@/lib/categoryTree'

const CLOSE_DELAY_MS = 160
const PREVIEW_LIMIT = 4

function money(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(n) || 0)
}

export default function CategoryBar({ categories }) {
  const [openId, setOpenId] = useState(null)   // panel desktop
  const [sheetId, setSheetId] = useState(null) // hoja inferior móvil
  const [preview, setPreview] = useState({})   // { [slug]: producto[] }

  const closeTimer = useRef(null)
  const fetched = useRef(new Set())

  const tree = useMemo(() => buildCategoryTree(categories), [categories])

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpenId(null); setSheetId(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Bloquear scroll del body mientras la hoja móvil esté abierta
  useEffect(() => {
    if (!sheetId) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [sheetId])

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  if (!tree.length) return null

  // Trae hasta 4 productos de la categoría. Una sola vez por slug.
  async function loadPreview(slug) {
    if (fetched.current.has(slug)) return
    fetched.current.add(slug)
    try {
      const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}&limit=${PREVIEW_LIMIT}&fields=mini`)
      if (!res.ok) return
      const data = await res.json()
      setPreview((p) => ({ ...p, [slug]: data.products || [] }))
    } catch {
      // Sin vista previa el panel sigue siendo útil: quedan las subcategorías.
    }
  }

  const openNow = (cat) => {
    clearTimeout(closeTimer.current)
    setOpenId(cat._id)
    loadPreview(cat.slug)
  }
  const closeSoon = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }

  const sheetCat = tree.find((c) => c._id === sheetId)

  return (
    <>
      <div
        className="relative bg-white border-b border-slate-200"
        onMouseLeave={closeSoon}
      >
        <div className="max-w-7xl mx-auto px-4">
          <nav
            className="flex items-center gap-1 md:gap-0.5 h-12 overflow-x-auto md:overflow-visible scroll-chip"
            aria-label="Categorías"
          >
            <Link
              href="/productos"
              className="whitespace-nowrap px-3 py-1.5 text-[13px] md:text-sm font-bold text-slate-900 hover:text-brand-700 transition-colors"
            >
              Todos los productos
            </Link>

            {tree.map((cat) => {
              const hasKids = cat.children.length > 0
              const isOpen = openId === cat._id

              return (
                <div
                  key={cat._id}
                  className="shrink-0"
                  onMouseEnter={() => hasKids && openNow(cat)}
                >
                  <div className="flex items-center">
                    <Link
                      href={`/categoria/${cat.slug}`}
                      className={`whitespace-nowrap px-3 py-1.5 text-[13px] md:text-sm font-semibold transition-colors ${
                        isOpen ? 'text-brand-700' : 'text-slate-700 hover:text-brand-700'
                      }`}
                    >
                      {cat.name}
                    </Link>

                    {hasKids && (
                      <button
                        type="button"
                        aria-label={`Ver subcategorías de ${cat.name}`}
                        aria-expanded={isOpen}
                        onClick={(e) => {
                          e.preventDefault()
                          if (window.innerWidth >= 768) {
                            isOpen ? setOpenId(null) : openNow(cat)
                          } else {
                            setSheetId(cat._id)
                            loadPreview(cat.slug)
                          }
                        }}
                        className={`-ml-1.5 pr-2 py-1.5 transition-colors ${
                          isOpen ? 'text-brand-700' : 'text-slate-400 hover:text-brand-700'
                        }`}
                      >
                        <svg
                          width="13" height="13" viewBox="0 0 20 20" fill="currentColor"
                          style={{ transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }}
                        >
                          <path
                            fillRule="evenodd" clipRule="evenodd"
                            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        {/* ── Panel ancho (desktop) ── */}
        {openId && (() => {
          const cat = tree.find((c) => c._id === openId)
          if (!cat || !cat.children.length) return null
          const items = preview[cat.slug]

          return (
            <div
              className="hidden md:block absolute left-0 right-0 top-full z-40"
              onMouseEnter={() => clearTimeout(closeTimer.current)}
              onMouseLeave={closeSoon}
            >
              <div className="bg-white border-b border-slate-200 shadow-card-hover">
                <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-[280px_1fr] gap-8">

                  {/* Subcategorías */}
                  <div className="border-r border-slate-100 pr-6">
                    <Link
                      href={`/categoria/${cat.slug}`}
                      onClick={() => setOpenId(null)}
                      className="block px-3 py-2 rounded-lg text-sm font-bold text-brand-700 hover:bg-brand-50"
                    >
                      Ver todo en {cat.name}
                    </Link>
                    <div className="mt-1 max-h-[300px] overflow-y-auto">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub._id}
                          href={`/categoria/${sub.slug}`}
                          onClick={() => setOpenId(null)}
                          className="block px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Vista previa de productos */}
                  <div>
                    {items === undefined ? (
                      <div className="grid grid-cols-4 gap-4">
                        {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="aspect-square rounded-xl bg-slate-100" />
                            <div className="h-3 bg-slate-100 rounded mt-2.5 w-4/5" />
                            <div className="h-3 bg-slate-100 rounded mt-1.5 w-2/5" />
                          </div>
                        ))}
                      </div>
                    ) : items.length === 0 ? (
                      <div className="h-full grid place-items-center text-sm text-slate-400">
                        Explora las subcategorías de {cat.name}
                      </div>
                    ) : (
                      <>
                        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                          Destacados en {cat.name}
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                          {items.map((p) => (
                            <Link
                              key={p._id}
                              href={`/productos/${p._id}`}
                              onClick={() => setOpenId(null)}
                              className="group"
                            >
                              <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
                                {p.image ? (
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : null}
                              </div>
                              <div className="mt-2 text-[13px] text-slate-700 line-clamp-2 leading-snug group-hover:text-brand-700">
                                {p.name}
                              </div>
                              <div className="text-[13px] font-bold text-slate-900 mt-0.5">
                                {money(p.price)}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Hoja inferior móvil ── */}
      {sheetCat && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSheetId(null)} />
          <div className="relative w-full bg-white rounded-t-2xl max-h-[72vh] overflow-y-auto pb-6 shadow-2xl">
            <div className="sticky top-0 bg-white px-5 pt-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900">{sheetCat.name}</span>
                <button
                  type="button"
                  onClick={() => setSheetId(null)}
                  aria-label="Cerrar"
                  className="w-8 h-8 grid place-items-center rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <Link
              href={`/categoria/${sheetCat.slug}`}
              onClick={() => setSheetId(null)}
              className="block px-5 py-3.5 text-sm font-bold text-brand-700 border-b border-slate-100"
            >
              Ver todo en {sheetCat.name}
            </Link>
            {sheetCat.children.map((sub) => (
              <Link
                key={sub._id}
                href={`/categoria/${sub.slug}`}
                onClick={() => setSheetId(null)}
                className="block px-5 py-3.5 text-sm text-slate-700 border-b border-slate-50"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
