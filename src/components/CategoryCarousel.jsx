'use client'
// ============================================================
// CategoryCarousel — carrusel horizontal de categorías con flechas.
// Reemplaza el grid estático de la home para que desborde a los
// lados en lugar de bajar a una nueva fila.
// ============================================================
import { useRef, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { buildCategoryTree } from '@/lib/categoryTree'

const PREVIEW_LIMIT = 4
const CLOSE_DELAY_MS = 160

function money(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(n) || 0)
}

export default function CategoryCarousel({ categories = [], allCategories = [] }) {
  const stripRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  // Desplegable al pasar el mouse: subcategorías + productos de la categoría.
  const [openId, setOpenId] = useState(null)
  const [preview, setPreview] = useState({})
  const closeTimer = useRef(null)
  const fetched = useRef(new Set())

  // Árbol armado con la lista completa (incluye subcategorías), pero solo
  // mostramos como tarjetas las principales que nos pasaron en `categories`.
  const tree = useMemo(() => {
    const source = allCategories.length ? allCategories : categories
    const byId = new Map(buildCategoryTree(source).map((c) => [String(c._id), c]))
    return categories.map((c) => byId.get(String(c._id)) || { ...c, children: [] })
  }, [categories, allCategories])

  async function loadPreview(slug) {
    if (fetched.current.has(slug)) return
    fetched.current.add(slug)
    try {
      const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}&limit=${PREVIEW_LIMIT}&fields=mini`)
      if (!res.ok) return
      const data = await res.json()
      setPreview((p) => ({ ...p, [slug]: data.products || [] }))
    } catch {
      // Sin vista previa el desplegable sigue sirviendo para las subcategorías.
    }
  }

  function openNow(cat) {
    clearTimeout(closeTimer.current)
    setOpenId(cat._id)
    loadPreview(cat.slug)
  }
  function closeSoon() {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  // Cerrar si el usuario hace scroll horizontal: el panel quedaría desalineado.
  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const onScroll = () => setOpenId(null)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Revisar si hay scroll disponible en cada dirección
  function checkScroll() {
    const el = stripRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    checkScroll()
    const el = stripRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [categories.length])

  const CARD_W = 180 // ancho aprox de una tarjeta + gap (px)

  function scrollBy(dir) {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * CARD_W * 3, behavior: 'smooth' })
  }

  return (
    <div className="relative" onMouseLeave={closeSoon}>
      {/* Flecha izquierda */}
      <button
        type="button"
        aria-label="Ver anteriores"
        onClick={() => scrollBy(-1)}
        className={
          'absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md grid place-items-center text-slate-700 hover:bg-slate-50 transition-opacity duration-200 ' +
          (canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
      >
        <span className="text-xl leading-none">‹</span>
      </button>

      {/* Tira scrolleable */}
      <div
        ref={stripRef}
        className="flex gap-4 overflow-x-auto scroll-smooth px-1 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tree.map((c) => (
          <div
            key={c._id}
            className="shrink-0"
            onMouseEnter={() => c.children.length && openNow(c)}
          >
          <Link
            href={`/categoria/${c.slug}`}
            className="card-hover group block bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 hover:border-brand-200 flex flex-col"
            style={{ width: 160 }}
          >
            <div className="aspect-square bg-brand-50 overflow-hidden relative" style={{ width: 160 }}>
              {c.image ? (
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : c.icon ? (
                <div className="w-full h-full grid place-items-center text-4xl text-brand-700">
                  {c.icon}
                </div>
              ) : (
                <div className="w-full h-full grid place-items-center text-3xl font-black text-brand-700">
                  {c.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="px-3 py-3 text-center">
              <div className="font-semibold text-slate-900 text-sm line-clamp-1">{c.name}</div>
              {c.children.length > 0 && (
                <div className="text-[10.5px] text-slate-400 mt-0.5">
                  {c.children.length} subcategorías
                </div>
              )}
            </div>
          </Link>
          </div>
        ))}
      </div>

      {/* Flecha derecha */}
      <button
        type="button"
        aria-label="Ver siguientes"
        onClick={() => scrollBy(1)}
        className={
          'absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-md grid place-items-center text-slate-700 hover:bg-slate-50 transition-opacity duration-200 ' +
          (canRight ? 'opacity-100' : 'opacity-0 pointer-events-none')
        }
      >
        <span className="text-xl leading-none">›</span>
      </button>

      {/* ── Desplegable: subcategorías + productos de la categoría ── */}
      {openId && (() => {
        const cat = tree.find((c) => c._id === openId)
        if (!cat || !cat.children.length) return null
        const items = preview[cat.slug]

        return (
          <div
            className="hidden md:block absolute left-0 right-0 top-full mt-2 z-30"
            onMouseEnter={() => clearTimeout(closeTimer.current)}
            onMouseLeave={closeSoon}
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card-hover p-5 grid grid-cols-[250px_1fr] gap-6 animate-fade-in-up">

              {/* Subcategorías */}
              <div className="border-r border-slate-100 pr-5">
                <Link
                  href={`/categoria/${cat.slug}`}
                  onClick={() => setOpenId(null)}
                  className="block px-3 py-2 rounded-lg text-sm font-bold text-brand-700 hover:bg-brand-50"
                >
                  Ver todo en {cat.name}
                </Link>
                <div className="mt-1 max-h-[260px] overflow-y-auto">
                  {cat.children.map((sub) => (
                    <Link
                      key={sub._id}
                      href={`/categoria/${sub.slug}`}
                      onClick={() => setOpenId(null)}
                      className="block px-3 py-1.5 rounded-lg text-[13.5px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Productos */}
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
                      Productos en {cat.name}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {items.map((p) => (
                        <Link
                          key={p._id}
                          href={`/productos/${p._id}`}
                          onClick={() => setOpenId(null)}
                          className="group/item"
                        >
                          <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                              />
                            ) : null}
                          </div>
                          <div className="mt-2 text-[12.5px] text-slate-700 line-clamp-2 leading-snug group-hover/item:text-brand-700">
                            {p.name}
                          </div>
                          <div className="text-[12.5px] font-bold text-slate-900 mt-0.5">
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
        )
      })()}

      {/* Ocultar scrollbar webkit */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
