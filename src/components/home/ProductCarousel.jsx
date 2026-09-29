'use client'
// ============================================================
// src/components/home/ProductCarousel.jsx
// Carrusel horizontal de productos (hacia la derecha, no cuadrícula).
//
// - Fila con scroll-snap: 2 tarjetas en celular (con un "asomo" de
//   la siguiente para que se note que hay más), 3 en sm, 4 en md,
//   5 en lg.
// - Flechas circulares que se ocultan cuando ya no se puede avanzar
//   hacia ese lado.
// - Barra de progreso delgada debajo.
//
// Nota: ProductCard tiene un desplegable de descuentos que se abre
// hacia abajo. Como un contenedor con overflow-x recorta también en
// vertical, la fila lleva relleno inferior extra (compensado con
// margen negativo y sin eventos de puntero) para que el panel quepa.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import Icon from '@/components/Icon'

export default function ProductCarousel({ products = [], label = 'Productos', colorFilter }) {
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [bar, setBar] = useState({ left: 0, width: 100 })

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < max - 4)
    const width = el.scrollWidth ? Math.min(100, (el.clientWidth / el.scrollWidth) * 100) : 100
    const left = max > 0 ? (el.scrollLeft / max) * (100 - width) : 0
    setBar({ left, width })
  }, [])

  useEffect(() => {
    update()
    const el = trackRef.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update, products.length])

  function go(dir) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  if (!products.length) return null

  const arrowCls =
    'absolute top-[30%] -translate-y-1/2 z-10 hidden sm:grid place-items-center w-11 h-11 rounded-full bg-white text-slate-900 shadow-card-hover border border-slate-100 hover:bg-slate-900 hover:text-white transition-colors'

  return (
    <div className="relative" role="region" aria-roledescription="carrusel" aria-label={label}>
      <div
        ref={trackRef}
        // Nada de pointer-events-none aquí: en celular impedía deslizar
        // el carrusel con el dedo.
        className="flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth
          pt-2 pb-2 -mx-4 px-4 scroll-px-4
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
      >
        {products.map((p) => (
          <div
            key={p._id}
            className="snap-start shrink-0
              w-[calc((100%-0.75rem)/2.15)] sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)]"
          >
            <ProductCard product={p} colorFilter={colorFilter} tiersArriba />
          </div>
        ))}
      </div>

      {canPrev && (
        <button type="button" onClick={() => go(-1)} aria-label="Productos anteriores" className={`${arrowCls} -left-3 md:-left-5`}>
          <Icon name="chevron" className="w-5 h-5 rotate-180" />
        </button>
      )}
      {canNext && (
        <button type="button" onClick={() => go(1)} aria-label="Más productos" className={`${arrowCls} -right-3 md:-right-5`}>
          <Icon name="chevron" className="w-5 h-5" />
        </button>
      )}

      {/* Barra de progreso */}
      {bar.width < 100 && (
        <div className="relative mt-6 h-1 rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
          <div
            className="absolute inset-y-0 rounded-full bg-slate-900 transition-[left] duration-150"
            style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
          />
        </div>
      )}
    </div>
  )
}
