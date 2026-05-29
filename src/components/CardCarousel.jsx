'use client'
// Carrusel de tarjeta — estático por defecto.
// Al hacer hover aparecen flechas laterales y dots abajo para navegar manualmente.
// Sin auto-slide: el usuario controla cuándo avanzar.
import { useState } from 'react'

export default function CardCarousel({ images: rawImages, alt }) {
  const images = rawImages.slice(0, 6)
  const [idx, setIdx]       = useState(0)
  const [hovered, setHovered] = useState(false)

  if (!images.length) return null

  const hasMultiple = images.length > 1

  function prev(e) {
    e.preventDefault(); e.stopPropagation()
    setIdx((i) => (i - 1 + images.length) % images.length)
  }
  function next(e) {
    e.preventDefault(); e.stopPropagation()
    setIdx((i) => (i + 1) % images.length)
  }
  function goTo(e, i) {
    e.preventDefault(); e.stopPropagation()
    setIdx(i)
  }

  return (
    <div
      className="relative w-full h-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imágenes — cross-fade */}
      {images.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={i === 0 ? alt : `${alt} ${i + 1}`}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 group-hover:scale-105 transition-transform duration-300 ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Controles — solo visibles al hover Y si hay más de 1 imagen */}
      {hasMultiple && (
        <>
          {/* Flecha izquierda */}
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={prev}
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20
              w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center
              text-slate-700 hover:bg-white transition-opacity duration-200
              ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" />
            </svg>
          </button>

          {/* Flecha derecha */}
          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={next}
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20
              w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center
              text-slate-700 hover:bg-white transition-opacity duration-200
              ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>

          {/* Dots */}
          <div
            className={`absolute bottom-2 left-1/2 -translate-x-1/2 z-20
              flex gap-1.5 transition-opacity duration-200
              ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Imagen ${i + 1}`}
                onClick={(e) => goTo(e, i)}
                className={`rounded-full transition-all duration-200 ${
                  i === idx
                    ? 'w-2 h-2 bg-white shadow'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
