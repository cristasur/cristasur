'use client'
// ============================================================
// Barra de chips de categoría — elemento sticky INDEPENDIENTE,
// fuera del <header>. Así su animación nunca afecta la altura
// del header y no hay loop de scroll.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function CategoryBar({ categories }) {
  const [visible, setVisible] = useState(true)
  const [headerH, setHeaderH] = useState(96)   // altura del header (px)
  const lastY = useRef(0)
  const locked = useRef(false)

  // Medir la altura real del header y actualizarla si cambia (ej: resize)
  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const update = () => setHeaderH(header.offsetHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])

  // Auto-ocultar al bajar, mostrar al subir
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
        setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
      } else if (delta < -50) {
        setVisible(true)
        lastY.current = y
        locked.current = true
        setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!categories?.length) return null

  return (
    // sticky justo debajo del header; z-30 < z-40 del header
    <div
      className="sticky z-30 bg-white/95 backdrop-blur border-b border-slate-200"
      style={{ top: headerH }}
    >
      {/* Contenedor de altura fija — el header no se mueve */}
      <div className="relative overflow-hidden" style={{ height: 48 }}>
        {/* Chips: se desliza arriba/abajo con translateY */}
        <div
          className={`max-w-7xl mx-auto px-4 flex items-center gap-2 h-full overflow-x-auto scroll-chip transition-transform duration-300 ease-in-out ${
            visible ? 'translate-y-0' : '-translate-y-full'
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

        {/* Tab toggle — centrado, asoma 20px abajo */}
        <button
          type="button"
          onClick={() => {
            setVisible(v => !v)
            locked.current = true
            setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
          }}
          aria-label={visible ? 'Ocultar categorías' : 'Mostrar categorías'}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-10
            flex items-center justify-center w-10 h-5 rounded-b-full
            bg-white border border-slate-200 border-t-0
            text-slate-400 hover:text-slate-700 shadow-sm transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className={`w-3.5 h-3.5 transition-transform duration-300 ${visible ? '' : 'rotate-180'}`}>
            <path fillRule="evenodd" clipRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
