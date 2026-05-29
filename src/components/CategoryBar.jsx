'use client'
// ============================================================
// Barra de chips de categoría.
// Se oculta con opacity (NO con max-h) para evitar reflow del
// header sticky que causaba el loop de scroll.
// El espacio físico siempre está reservado → sin saltos de layout.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function CategoryBar({ categories }) {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)
  const locked = useRef(false)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      if (locked.current) return
      const y = window.scrollY

      if (y < 80) {
        setVisible(true)
        lastY.current = y
        return
      }

      const delta = y - lastY.current

      if (delta > 60) {
        setVisible(false)
        lastY.current = y
        locked.current = true
        setTimeout(() => {
          lastY.current = window.scrollY   // re-anclar DESPUÉS del cooldown
          locked.current = false
        }, 600)
      } else if (delta < -50) {
        setVisible(true)
        lastY.current = y
        locked.current = true
        setTimeout(() => {
          lastY.current = window.scrollY
          locked.current = false
        }, 600)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!categories?.length) return null

  return (
    <div className="relative border-t border-slate-100">
      {/* Barra — siempre ocupa espacio (no colapsa), solo cambia visibilidad */}
      <div
        className={`flex items-center gap-2 py-3 overflow-x-auto scroll-chip transition-opacity duration-300 ${
          visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <Link
          href="/productos"
          className="whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-800"
        >
          Todos los productos
        </Link>
        {categories.map((c) => (
          <Link
            key={c._id}
            href={`/categoria/${c.slug}`}
            className="whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full bg-slate-100 hover:bg-brand-100 text-slate-700 hover:text-brand-800"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Tab toggle */}
      <button
        type="button"
        onClick={() => {
          setVisible((v) => !v)
          locked.current = true
          setTimeout(() => {
            lastY.current = window.scrollY
            locked.current = false
          }, 600)
        }}
        aria-label={visible ? 'Ocultar categorías' : 'Mostrar categorías'}
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-10
          flex items-center justify-center
          w-10 h-5 rounded-b-full
          bg-white border border-slate-200 border-t-0
          text-slate-400 hover:text-slate-700 hover:bg-slate-50
          shadow-sm transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-3.5 h-3.5 transition-transform duration-300 ${visible ? '' : 'rotate-180'}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  )
}
