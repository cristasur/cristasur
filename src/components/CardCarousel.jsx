'use client'
// Mini carrusel automático para tarjetas de producto.
// - Avanza solo cada 3 s si hay más de 1 imagen.
// - Se pausa al hacer hover.
// - Dots clickeables abajo (stopPropagation para no navegar).
// - Cross-fade suave entre imágenes con opacity transition.
// - Máximo 5 imágenes para no sobrecargar la red.
import { useState, useEffect, useRef, useCallback } from 'react'

export default function CardCarousel({ images: rawImages, alt, className = '' }) {
  const images = rawImages.slice(0, 5)   // límite razonable
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)

  const start = useCallback(() => {
    if (images.length < 2) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % images.length)
    }, 3000)
  }, [images.length])

  const stop = useCallback(() => {
    clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    start()
    return stop
  }, [start, stop])

  if (!images.length) return null

  return (
    <div
      className={`relative w-full h-full ${className}`}
      onMouseEnter={stop}
      onMouseLeave={start}
    >
      {/* Todas las imágenes apiladas; solo la activa es opaca */}
      {images.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt={i === 0 ? alt : `${alt} ${i + 1}`}
          loading={i === 0 ? 'lazy' : 'lazy'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            i === idx ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Dots — solo si hay más de 1 imagen */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Imagen ${i + 1}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIdx(i)
                // Reiniciar el timer desde este punto
                clearInterval(timerRef.current)
                timerRef.current = setInterval(() => {
                  setIdx((cur) => (cur + 1) % images.length)
                }, 3000)
              }}
              className={`rounded-full transition-all duration-200 ${
                i === idx
                  ? 'w-2 h-2 bg-white shadow'
                  : 'w-1.5 h-1.5 bg-white/55'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
