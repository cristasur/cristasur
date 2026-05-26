'use client'
// ============================================================
// CategoryCarousel — carrusel horizontal de categorías con flechas.
// Reemplaza el grid estático de la home para que desborde a los
// lados en lugar de bajar a una nueva fila.
// ============================================================
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

export default function CategoryCarousel({ categories = [] }) {
  const stripRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

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
    <div className="relative">
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
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/categoria/${c.slug}`}
            className="card-hover group shrink-0 bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 hover:border-brand-200 flex flex-col"
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
            </div>
          </Link>
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

      {/* Ocultar scrollbar webkit */}
      <style>{`
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
