'use client'
// ============================================================
// SubcategoryStrip — tira horizontal de subcategorías con la
// imagen en círculo, debajo del encabezado de una categoría.
//
// Si caben todas se centran; si no, se desplaza con flechas.
// No renderiza nada cuando la categoría no tiene hijas.
// ============================================================
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'

export default function SubcategoryStrip({ subcategories = [] }) {
  const stripRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

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
  }, [subcategories.length])

  if (!subcategories.length) return null

  function scrollBy(dir) {
    stripRef.current?.scrollBy({ left: dir * 480, behavior: 'smooth' })
  }

  return (
    <div className="relative border-y border-slate-100 py-5">
      <button
        type="button"
        aria-label="Ver anteriores"
        onClick={() => scrollBy(-1)}
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md grid place-items-center text-slate-600 hover:bg-slate-50 transition-opacity ${
          canLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div
        ref={stripRef}
        className="flex gap-2 overflow-x-auto scroll-smooth px-8 justify-start lg:justify-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {subcategories.map((sub) => (
          <Link
            key={sub._id}
            href={`/categoria/${sub.slug}`}
            className="group shrink-0 w-[120px] flex flex-col items-center text-center px-2 py-1"
          >
            <div className="w-[76px] h-[76px] rounded-full bg-gradient-to-br from-slate-50 to-slate-200/70 grid place-items-center overflow-hidden">
              {sub.image ? (
                <img
                  src={sub.image}
                  alt={sub.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : sub.icon ? (
                <span className="text-2xl">{sub.icon}</span>
              ) : (
                <span className="text-xl font-black text-brand-700">
                  {sub.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {/* Alto reservado para 2 líneas: la tira queda pareja */}
            <div
              className="mt-2.5 text-[12.5px] leading-snug line-clamp-2 text-slate-700 group-hover:text-brand-600 transition-colors"
              style={{ minHeight: '2.6em' }}
            >
              {sub.name}
            </div>
          </Link>
        ))}
      </div>

      <button
        type="button"
        aria-label="Ver siguientes"
        onClick={() => scrollBy(1)}
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md grid place-items-center text-slate-600 hover:bg-slate-50 transition-opacity ${
          canRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <style>{`div::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}
