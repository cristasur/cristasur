'use client'
// ============================================================
// src/components/home/ReelsStrip.jsx
// "Contenido reciente": fila horizontal de cuadros verticales
// (4:5) con los reels / publicaciones de redes.
//
// - Si el cuadro trae videoUrl (mp4) se reproduce en silencio y en
//   bucle, con la imagen como portada. preload="none" para no gastar
//   datos hasta que el navegador lo necesite.
// - Si no, solo la imagen.
// - Todo el cuadro es link al reel (pestaña nueva si es externo).
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/Icon'

const isExternal = (href = '') => /^https?:\/\//i.test(href)

function TileLink({ href, label, children }) {
  const cls = 'group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100'
  if (!href) return <div className={cls}>{children}</div>
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} aria-label={label} className={cls}>
      {children}
    </Link>
  )
}

export default function ReelsStrip({ items = [] }) {
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const update = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
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
  }, [update, items.length])

  function go(dir) {
    const el = trackRef.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' })
  }

  if (!items.length) return null

  const arrowCls =
    'absolute top-1/2 -translate-y-1/2 z-10 hidden sm:grid place-items-center w-11 h-11 rounded-full bg-white text-slate-900 shadow-card-hover border border-slate-100 hover:bg-slate-900 hover:text-white transition-colors'

  return (
    <div className="relative" role="region" aria-roledescription="carrusel" aria-label="Contenido reciente">
      <div
        ref={trackRef}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-4 px-4 scroll-px-4
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it, i) => {
          const label = it.title || `Publicación ${i + 1}`
          return (
            <div
              key={it._id || i}
              className="snap-start shrink-0 w-[calc((100%-0.75rem)/2.2)] sm:w-[calc((100%-2rem)/3.2)] md:w-[calc((100%-3rem)/4)] lg:w-[calc((100%-4rem)/5)]"
            >
              <TileLink href={it.href} label={label}>
                {it.videoUrl ? (
                  <video
                    src={it.videoUrl}
                    poster={it.image}
                    muted
                    loop
                    playsInline
                    autoPlay
                    preload="none"
                    aria-label={label}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <img
                    src={it.image}
                    alt={label}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                )}

                {/* Degradado + título */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 pointer-events-none" />
                {it.title && (
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white text-sm font-bold leading-snug line-clamp-2 pointer-events-none">
                    {it.title}
                  </div>
                )}

                {/* Ícono de play */}
                <span className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/85 backdrop-blur text-slate-900 grid place-items-center shadow pointer-events-none">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 translate-x-[1px]" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
                  </svg>
                </span>
              </TileLink>
            </div>
          )
        })}
      </div>

      {canPrev && (
        <button type="button" onClick={() => go(-1)} aria-label="Publicaciones anteriores" className={`${arrowCls} -left-3 md:-left-5`}>
          <Icon name="chevron" className="w-5 h-5 rotate-180" />
        </button>
      )}
      {canNext && (
        <button type="button" onClick={() => go(1)} aria-label="Más publicaciones" className={`${arrowCls} -right-3 md:-right-5`}>
          <Icon name="chevron" className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
