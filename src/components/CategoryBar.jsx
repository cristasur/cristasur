'use client'
// ============================================================
// Barra de chips de categoría — sticky FUERA del header.
// Desktop: se retrae completamente (height → 0) al bajar,
//          con botón fijo para recuperarla.
// Mobile: siempre visible, sin botón toggle.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

export default function CategoryBar({ categories }) {
  const [visible, setVisible] = useState(true)
  const [headerH, setHeaderH] = useState(96)
  const lastY   = useRef(0)
  const locked  = useRef(false)

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

  // Auto-ocultar al bajar / mostrar al subir — solo en desktop (≥768px)
  useEffect(() => {
    const isDesktop = () => window.innerWidth >= 768

    lastY.current = window.scrollY

    const onScroll = () => {
      // En móvil siempre visible
      if (!isDesktop()) { setVisible(true); return }
      if (locked.current) return

      const y = window.scrollY

      // Cerca del tope → siempre visible
      if (y < 80) {
        setVisible(true)
        lastY.current = y
        return
      }

      const delta = y - lastY.current
      if (delta > 60) {
        // Bajando — ocultar
        setVisible(false)
        lastY.current = y
        locked.current = true
        setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
      } else if (delta < -50) {
        // Subiendo — mostrar
        setVisible(true)
        lastY.current = y
        locked.current = true
        setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
      }
    }

    // Al pasar a móvil restaurar visibilidad
    const onResize = () => { if (!isDesktop()) setVisible(true) }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  if (!categories?.length) return null

  const toggle = () => {
    setVisible(v => !v)
    locked.current = true
    setTimeout(() => { lastY.current = window.scrollY; locked.current = false }, 600)
  }

  const BAR_H = 48

  return (
    <>
      {/*
        Barra sticky — se encoge a height:0 cuando está oculta.
        overflowAnchor:none evita que el browser ajuste scrollY al cambiar el tamaño,
        lo que previene loops de scroll.
      */}
      <div
        style={{
          position: 'sticky',
          top: headerH,
          zIndex: 30,
          height: visible ? BAR_H : 0,
          overflow: 'hidden',
          transition: 'height 0.3s ease-in-out',
          overflowAnchor: 'none',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: visible ? '1px solid #e2e8f0' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 h-full overflow-x-auto scroll-chip">
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

      {/*
        Botón toggle — posición fija justo debajo del borde inferior de la barra.
        Visible solo en desktop (hidden md:flex).
        Cuando la barra tiene height 0, el botón queda pegado al header.
        La transición de `top` sigue el movimiento de la barra.
      */}
      <button
        type="button"
        onClick={toggle}
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
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          style={{ transition: 'transform 0.3s ease-in-out', transform: visible ? 'rotate(0deg)' : 'rotate(180deg)' }}
          className="w-3.5 h-3.5"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
          />
        </svg>
      </button>
    </>
  )
}
