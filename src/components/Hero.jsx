'use client'
// ============================================================
// Hero carrusel — Slide 1: hero con texto y categorías.
// Slides 2+: banners de imagen. Agrega más en BANNER_SLIDES.
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Icon from './Icon'

const AUTOPLAY_MS = 8000

export default function Hero({ categories = [], banners = [] }) {
  const totalSlides = 1 + banners.length
  const [current, setCurrent]   = useState(0)
  const timerRef                = useRef(null)

  const go = useCallback((idx) => {
    setCurrent((idx + totalSlides) % totalSlides)
  }, [totalSlides])

  const next = useCallback(() => go(current + 1), [current, go])
  const prev = useCallback(() => go(current - 1), [current, go])

  // Autoplay — siempre activo en pc y móvil
  useEffect(() => {
    if (totalSlides < 2) return
    timerRef.current = setTimeout(next, AUTOPLAY_MS)
    return () => clearTimeout(timerRef.current)
  }, [current, next, totalSlides])

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: '420px' }}
    >
      {/* ── Slides track ─────────────────────────────────── */}
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)`, willChange: 'transform' }}
      >

        {/* ── Slide 0: Hero original ───────────────────── */}
        <div className="relative min-w-full bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
          <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />
          <div className="absolute -top-40 -right-20 w-[28rem] h-[28rem] bg-accent-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] bg-brand-400/30 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs uppercase tracking-widest mb-6 backdrop-blur">
                Mayoreo y Menudeo
              </span>
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                Todo para tu <span className="text-accent-300">hogar</span> y tu <span className="text-accent-300">negocio</span>.
              </h1>
              <p className="mt-6 text-lg text-brand-100 max-w-xl">
                Equipa tu hogar o negocio con la mejor calidad al mejor precio.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/productos"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-semibold shadow-lg"
                >
                  Ver catálogo
                  <Icon name="arrow" className="w-4 h-4" />
                </Link>
                <Link
                  href="/productos?featured=1"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold backdrop-blur"
                >
                  Productos destacados
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
                {[
                  { icon: 'tag',    t: 'Precios de mayoreo' },
                  { icon: 'truck',  t: 'Envío nacional' },
                  { icon: 'shield', t: 'Calidad garantizada' },
                ].map((b) => (
                  <div key={b.t} className="text-sm">
                    <Icon name={b.icon} className="w-6 h-6 text-accent-300" />
                    <div className="mt-2 font-semibold">{b.t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid de categorías */}
            <div className="grid grid-cols-2 gap-3">
              {categories.slice(0, 4).map((c, i) => (
                <Link
                  key={c._id}
                  href={`/categoria/${c.slug}`}
                  className={`group relative overflow-hidden aspect-[5/4] rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex flex-col justify-end hover:bg-white/15 transition ${i === 1 ? 'md:translate-y-6' : ''} ${i === 2 ? 'md:-translate-y-6' : ''}`}
                >
                  {c.image ? (
                    <>
                      <img
                        src={c.image}
                        alt={c.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/30 to-transparent" />
                    </>
                  ) : c.icon ? (
                    <div className="absolute inset-0 grid place-items-center text-6xl opacity-70">
                      {c.icon}
                    </div>
                  ) : null}
                  <div className="relative p-5">
                    <span className="text-[10px] uppercase tracking-widest text-white/70">Categoría</span>
                    <div className="text-xl font-bold leading-tight mt-1">{c.name}</div>
                    <div className="text-sm text-white/80 mt-1 flex items-center gap-1 group-hover:text-white">
                      Explorar <Icon name="arrow" className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Slides 1+: banners de imagen (desde DB) ─── */}
        {banners.map((slide, i) => (
          <div key={i} className="relative min-w-full">
            <img
              src={slide.image}
              alt={slide.title || 'Banner CRISTASUR'}
              className="w-full h-full object-cover"
              style={{ minHeight: '420px', maxHeight: '600px' }}
            />
            {/* Overlay solo si hay texto encima */}
            {slide.title && (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/60 to-transparent" />
            )}
            {/* Texto opcional */}
            {slide.title && (
              <div className="absolute inset-0 flex items-center">
                <div className="max-w-7xl mx-auto px-4 w-full">
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight max-w-lg">
                    {slide.title}
                  </h2>
                  {slide.subtitle && (
                    <p className="mt-3 text-lg text-white/80 max-w-md">{slide.subtitle}</p>
                  )}
                  {slide.cta && slide.href && (
                    <Link
                      href={slide.href}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold shadow-lg"
                    >
                      {slide.cta}
                      <Icon name="arrow" className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Flechas (solo si hay más de 1 slide) ─────── */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Siguiente"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* ── Puntos de navegación ──────────────────────── */}
      {totalSlides > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
