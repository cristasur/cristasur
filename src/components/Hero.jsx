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
// Medidas:
//   Compu:   2000 × 800 px  (2.5 : 1)
//   Celular: 1080 × 1920 px (vertical 9:16), opcional
//
// En celular el banner ocupa casi toda la pantalla inicial (de
// orilla a orilla, alto fijo = pantalla menos el menú). Cada banner
// usa su versión de celular si la tiene; si no, la de compu recortada
// con su encuadre de celular. Como el alto es fijo, no brinca.
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { normalizarEncuadre } from '@/lib/encuadre'

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
    <section className="md:pt-8">
      {/* ── Rectángulo del carrusel ─────────────────── */}
      <div
        className="relative overflow-hidden bg-slate-100"
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
            // Encuadre elegido en el panel. En celular se usa el suyo solo
            // si de verdad se está mostrando la imagen de celular.
            const pc = normalizarEncuadre(slide.pos)
            const cel = normalizarEncuadre(slide.posMobile)
            const vars = {
              '--bx': `${pc.x}%`, '--by': `${pc.y}%`, '--bz': pc.zoom,
              '--bxm': `${cel.x}%`, '--bym': `${cel.y}%`, '--bzm': cel.zoom,
            }
            const img = (
              <picture className="block w-full h-full">
                {slide.imageMobile && <source media="(max-width: 767px)" srcSet={slide.imageMobile} />}
                <img
                  src={slide.image}
                  alt={slide.title || 'Promoción CRISTASUR'}
                  className="w-full h-full object-cover select-none
                    [object-position:var(--bxm)_var(--bym)] [transform:scale(var(--bzm))] [transform-origin:var(--bxm)_var(--bym)]
                    md:[object-position:var(--bx)_var(--by)] md:[transform:scale(var(--bz))] md:[transform-origin:var(--bx)_var(--by)]"
                  style={vars}
                  draggable={false}
                  // El primer banner es el LCP de la home.
                  fetchPriority={i === 0 ? 'high' : 'low'}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </picture>
            )

            return (
              <div
                key={slide._id || i}
                // Compu: de orilla a orilla, con la MISMA altura de antes
                // (el 40% del ancho del contenido, máx. 80rem).
                // Celular: alto de pantalla menos menú (64 px) y barra de
                // categorías (48 px), dejando asomar un poco lo de abajo.
                className="min-w-full overflow-hidden h-[calc(100vh-9rem)] supports-[height:100svh]:h-[calc(100svh-9rem)] md:supports-[height:100svh]:h-[calc((min(100vw,80rem)-2rem)*0.4)] min-h-[420px] max-h-[860px] md:h-[calc((min(100vw,80rem)-2rem)*0.4)] md:min-h-0 md:max-h-none"
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
