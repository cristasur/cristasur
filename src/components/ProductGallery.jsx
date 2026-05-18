'use client'
// ============================================================
// Galería del detalle de producto.
//   - Imagen grande con flechas ← / → sobre la misma foto.
//   - Tira de miniaturas debajo; si hay más de las que caben,
//     aparecen flechas laterales para desplazar la tira.
//   - Soporta teclado (←/→) cuando está enfocada.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'

export default function ProductGallery({ images = [], alt = 'Producto' }) {
  // Filtramos URLs vacías y removemos duplicados conservando orden.
  const clean = useMemo(() => {
    const seen = new Set()
    return images.filter((u) => {
      if (!u || typeof u !== 'string') return false
      if (seen.has(u)) return false
      seen.add(u)
      return true
    })
  }, [images])

  const [idx, setIdx] = useState(0)
  const stripRef = useRef(null)

  // Reset al cambiar de producto (cambia la lista)
  useEffect(() => {
    setIdx(0)
  }, [clean.length])

  const total = clean.length
  const hasMany = total > 1

  const goPrev = () => setIdx((i) => (i - 1 + total) % total)
  const goNext = () => setIdx((i) => (i + 1) % total)

  // Navegación con teclado
  useEffect(() => {
    if (!hasMany) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasMany])

  // Scroll horizontal de la tira de miniaturas
  const scrollStrip = (dir) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  // Aseguramos que la miniatura activa quede visible
  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const active = el.querySelector(`[data-idx="${idx}"]`)
    if (active) {
      active.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [idx])

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 aspect-square grid place-items-center text-slate-200">
        <Icon name="box" className="w-28 h-28" strokeWidth={1.5} />
      </div>
    )
  }

  const current = clean[idx]

  return (
    <div>
      {/* Imagen principal con flechas sobre la foto */}
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 aspect-square group">
        <img
          src={current}
          alt={`${alt} — imagen ${idx + 1}`}
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />

        {hasMany && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <span className="text-xl leading-none">‹</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Siguiente imagen"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
            >
              <span className="text-xl leading-none">›</span>
            </button>

            {/* Contador de posición */}
            <div className="absolute bottom-3 right-3 bg-black/55 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
              {idx + 1} / {total}
            </div>
          </>
        )}
      </div>

      {/* Tira de miniaturas con flechas laterales si hay muchas */}
      {hasMany && (
        <div className="relative mt-3">
          {total > 4 && (
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              aria-label="Ver miniaturas anteriores"
              className="hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
            >
              ‹
            </button>
          )}

          <div
            ref={stripRef}
            className="flex gap-2 overflow-x-auto scroll-smooth pb-1 px-1 md:px-10 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'thin' }}
          >
            {clean.map((url, i) => {
              const isActive = i === idx
              return (
                <button
                  key={`${url}-${i}`}
                  data-idx={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 snap-start transition-all ${
                    isActive
                      ? 'border-brand-600 ring-2 ring-brand-200'
                      : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Miniatura ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              )
            })}
          </div>

          {total > 4 && (
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              aria-label="Ver miniaturas siguientes"
              className="hidden md:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow text-slate-700 hover:bg-slate-50"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}
