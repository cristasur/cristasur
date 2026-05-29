'use client'
// ============================================================
// Barra de chips de categoría — se retrae al bajar y reaparece
// al subir. Un botón tab en el borde inferior permite toggle manual.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function CategoryBar({ categories }) {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)
  const locked = useRef(false)   // cooldown tras cambio de estado

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      if (locked.current) return
      const y = window.scrollY

      if (y < 80) {
        // Siempre visible al tope
        setVisible(true)
        lastY.current = y
        return
      }

      const delta = y - lastY.current

      if (delta > 50) {
        // Bajó más de 50px desde la última lectura → ocultar
        setVisible(false)
        lastY.current = y
        locked.current = true
        setTimeout(() => { locked.current = false }, 400)
      } else if (delta < -40) {
        // Subió más de 40px → mostrar
        setVisible(true)
        lastY.current = y
        locked.current = true
        setTimeout(() => { locked.current = false }, 400)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!categories?.length) return null

  return (
    <div className="relative border-t border-slate-100">
      {/* Barra de chips */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          visible ? 'max-h-14 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex items-center gap-2 py-3 overflow-x-auto scroll-chip">
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
      </div>

      {/* Tab toggle — pegado al borde inferior del header */}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
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
