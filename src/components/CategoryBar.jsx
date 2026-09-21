'use client'
// ============================================================
// Barra de categorías — sticky, debajo del header.
//
// Desktop: enlaces de texto en fila. Las que tienen subcategorías
//          muestran un chevron y despliegan un panel al pasar el
//          mouse (o con Enter desde teclado).
// Mobile:  scroll horizontal. Al tocar una categoría con hijas se
//          abre una hoja inferior con sus subcategorías.
//
// La jerarquía viene del campo `parent` de Category.
// ============================================================
import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'

const BAR_H = 46
const CLOSE_DELAY_MS = 140

export default function CategoryBar({ categories }) {
  const [visible, setVisible] = useState(true)
  const [headerH, setHeaderH] = useState(96)
  const [openId, setOpenId] = useState(null)   // desplegable desktop
  const [sheetId, setSheetId] = useState(null) // hoja inferior móvil

  const lastY = useRef(0)
  const locked = useRef(false)
  const closeTimer = useRef(null)

  // ── Construir el árbol: principales + sus hijas ──────────
  const tree = useMemo(() => {
    const list = Array.isArray(categories) ? categories : []
    const roots = list.filter((c) => !c.parent)
    const byParent = new Map()
    for (const c of list) {
      if (!c.parent) continue
      const k = String(c.parent)
      if (!byParent.has(k)) byParent.set(k, [])
      byParent.get(k).push(c)
    }
    return roots.map((r) => ({ ...r, children: byParent.get(String(r._id)) || [] }))
  }, [categories])

  // Medir altura real del header (cambia entre móvil y desktop)
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const update = () => setHeaderH(header.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  // Auto-ocultar al bajar / mostrar al subir — solo desktop (≥768px)
  useEffect(() => {
    const isDesktop = () => window.innerWidth >= 768
    lastY.current = window.scrollY

    const onScroll = () => {
      if (!isDesktop()) { setVisible(true); return }
      if (locked.current) return
      const y = window.scrollY

      if (y < 80) { setVisible(true); lastY.current = y; return }

      const delta = y - lastY.current
      if (delta > 60) {
        setVisible(false)
        setOpenId(null)
        lastY.current = y
        locked.current = true
        setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
      } else if (delta < -50) {
        setVisible(true)
        lastY.current = y
        locked.current = true
        setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
      }
    }

    const onResize = () => { if (!isDesktop()) setVisible(true) }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

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

  // Cierre con retardo para poder mover el mouse del enlace al panel
  const openNow = (id) => { clearTimeout(closeTimer.current); setOpenId(id) }
  const closeSoon = () => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }

  const toggleBar = () => {
    setVisible((v) => !v)
    setOpenId(null)
    locked.current = true
    setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
  }

  const sheetCat = tree.find((c) => c._id === sheetId)

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: headerH,
          zIndex: 30,
          height: visible ? BAR_H : 0,
          transition: 'height 0.3s ease-in-out',
          overflowAnchor: 'none',
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: visible ? '1px solid #e8edf3' : 'none',
        }}
        onMouseLeave={closeSoon}
      >
        <div className="max-w-7xl mx-auto px-4 h-full">
          <nav
            className="flex items-center gap-1 md:gap-0.5 h-full overflow-x-auto md:overflow-visible scroll-chip"
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
                  className="relative shrink-0"
                  onMouseEnter={() => hasKids && openNow(cat._id)}
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
                          // Desktop alterna el panel; móvil abre la hoja inferior.
                          if (window.innerWidth >= 768) {
                            setOpenId(isOpen ? null : cat._id)
                          } else {
                            setSheetId(cat._id)
                          }
                        }}
                        className={`-ml-1.5 pr-2 py-1.5 transition-colors ${
                          isOpen ? 'text-brand-700' : 'text-slate-400 hover:text-brand-700'
                        }`}
                      >
                        <svg
                          width="13" height="13" viewBox="0 0 20 20" fill="currentColor"
                          style={{
                            transition: 'transform 0.2s ease',
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                          }}
                        >
                          <path
                            fillRule="evenodd" clipRule="evenodd"
                            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* ── Desplegable desktop ── */}
                  {hasKids && isOpen && (
                    <div
                      className="hidden md:block absolute left-0 top-full pt-2 z-40"
                      onMouseEnter={() => openNow(cat._id)}
                      onMouseLeave={closeSoon}
                    >
                      <div className="min-w-[232px] max-w-[320px] bg-white rounded-xl border border-slate-100 shadow-card-hover py-2 animate-fade-in-up">
                        <Link
                          href={`/categoria/${cat.slug}`}
                          onClick={() => setOpenId(null)}
                          className="block px-4 py-2 text-[13px] font-bold text-brand-700 hover:bg-brand-50"
                        >
                          Ver todo en {cat.name}
                        </Link>
                        <div className="my-1 border-t border-slate-100" />
                        {cat.children.map((sub) => (
                          <Link
                            key={sub._id}
                            href={`/categoria/${sub.slug}`}
                            onClick={() => setOpenId(null)}
                            className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* ── Hoja inferior móvil ── */}
      {sheetCat && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setSheetId(null)}
          />
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

      {/* Botón para recuperar la barra cuando se retrae (solo desktop) */}
      <button
        type="button"
        onClick={toggleBar}
        aria-label={visible ? 'Ocultar categorías' : 'Mostrar categorías'}
        style={{
          position: 'fixed',
          top: headerH + (visible ? BAR_H : 0),
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 29,
          transition: 'top 0.3s ease-in-out',
        }}
        className="hidden md:flex items-center justify-center w-10 h-5 rounded-b-full
          bg-white border border-slate-200 border-t-0
          text-slate-400 hover:text-slate-700 shadow-sm transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          style={{ transition: 'transform 0.3s ease-in-out', transform: visible ? 'rotate(0deg)' : 'rotate(180deg)' }}
          className="w-3.5 h-3.5"
        >
          <path
            fillRule="evenodd" clipRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </button>
    </>
  )
}
