'use client'
// ============================================================
// Hero — carrusel de banners puro.
//
// Un solo rectángulo que rota imágenes hacia la derecha.
// Todo el contenido viene de la colección `Banner` (DB) y se
// administra en /admin/banners: imagen, enlace, orden y activo.
//
// Si no hay banners activos, el componente no renderiza nada
// (la home arranca directo con las categorías).
//
// Medida recomendada de imagen: 2000 × 720 px (relación ~2.8:1).
// Se recorta con object-cover, así que lo importante debe ir
// centrado para que no se pierda en móvil.
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

const AUTOPLAY_MS = 6000
const SWIPE_MIN_PX = 50

export default function Hero({ banners = [] }) {
  const slides = Array.isArray(banners) ? banners : []
  const total = slides.length

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const touchStartX = useRef(null)

  const go = useCallback(
    (idx) => setCurrent(((idx % total) + total) % total),
    [total]
  )
  const next = useCallback(() => go(current + 1), [current, go])
  const prev = useCallback(() => go(current - 1), [current, go])

  // Autoplay — se detiene al pasar el mouse encima o si solo hay 1 slide.
  useEffect(() => {
    if (total < 2 || paused) return
    timerRef.current = setTimeout(next, AUTOPLAY_MS)
    return () => clearTimeout(timerRef.current)
  }, [current, next, total, paused])

  // ── Swipe en móvil ──────────────────────────────────
  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e) {
    if (touchStartX.current == null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > SWIPE_MIN_PX) {
      delta < 0 ? next() : prev()
    }
    touchStartX.current = null
  }

  if (total === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 pt-5 md:pt-8">
      {/* ── Rectángulo del carrusel ─────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl bg-slate-100 shadow-card"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Promociones"
      >
        {/* Track: todas las slides en fila, se desplaza con translateX */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(-${current * 100}%)`,
            willChange: 'transform',
          }}
        >
          {slides.map((slide, i) => {
            const img = (
              <img
                src={slide.image}
                alt={slide.title || 'Promoción CRISTASUR'}
                className="w-full h-full object-cover select-none"
                draggable={false}
                // El primer banner es el LCP de la home.
                fetchPriority={i === 0 ? 'high' : 'low'}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            )

            return (
              <div
                key={slide._id || i}
                // Proporción fija 2000×720 en todos los tamaños: así el banner
                // se ve completo en celular y no se recorta el texto lateral.
                className="min-w-full aspect-[2000/720]"
                aria-hidden={i !== current}
              >
                {slide.href ? (
                  <Link
                    href={slide.href}
                    className="block w-full h-full"
                    tabIndex={i === current ? 0 : -1}
                    aria-label={slide.title || `Promoción ${i + 1}`}
                  >
                    {img}
                  </Link>
                ) : (
                  img
                )}
              </div>
            )
          })}
        </div>

        {/* ── Flechas (solo con 2 o más slides) ──────── */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center backdrop-blur transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/80 hover:bg-white text-slate-800 shadow-md flex items-center justify-center backdrop-blur transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ── Puntitos, abajo y centrados ──────────────── */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Ir a la promoción ${i + 1}`}
              aria-current={i === current}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-7 h-2.5 bg-brand-600'
                  : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
