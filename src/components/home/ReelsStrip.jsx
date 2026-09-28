'use client'
// ============================================================
// src/components/home/ReelsStrip.jsx
// "Contenido reciente": fila horizontal de cuadros verticales
// (4:5) con los reels de Instagram.
//
// - Cuadro: video mp4 propio (si hay) o la portada del reel.
// - Al darle clic se abre una ventana como la de Instagram:
//   video a la izquierda y a la derecha la cuenta, el texto del
//   reel, la fecha y "Ver en Instagram". Flechas para pasar al
//   siguiente, Esc para cerrar.
// - El video de Instagram se muestra con su reproductor oficial
//   (iframe de inserción), recortando su encabezado.
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/components/Icon'
import { estiloEncuadre } from '@/lib/encuadre'

const CUENTA = 'cristasurmx'
const PERFIL = `https://www.instagram.com/${CUENTA}/`

function fechaLarga(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mismoAño = d.getFullYear() === new Date().getFullYear()
  return d.toLocaleDateString('es-MX', {
    day: 'numeric', month: 'long', ...(mismoAño ? {} : { year: 'numeric' }), timeZone: 'America/Merida',
  })
}

// Texto del reel con links, hashtags y teléfonos clicables.
function TextoReel({ texto }) {
  if (!texto) return null
  const partes = texto.split(/(https?:\/\/[^\s]+|#[\p{L}\d_]+)/gu)
  return (
    <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700 break-words">
      {partes.map((p, i) => {
        if (/^https?:\/\//.test(p)) {
          return <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline break-all">{p}</a>
        }
        if (/^#/.test(p)) {
          return (
            <a key={i} href={`https://www.instagram.com/explore/tags/${encodeURIComponent(p.slice(1))}/`}
              target="_blank" rel="noopener noreferrer" className="text-brand-700 hover:underline">{p}</a>
          )
        }
        return <span key={i}>{p}</span>
      })}
    </p>
  )
}

function IconoInstagram({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// ── Video del cuadro ───────────────────────────────────────
// Como MAHA: se reproduce solo, sin sonido y en bucle, sin nada
// encima. Solo corre mientras está en pantalla (ahorra datos).
function VideoCuadro({ src, poster, pos }) {
  const ref = useRef(null)
  const [visto, setVisto] = useState(false)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setVisto(true)
        v.play?.().catch(() => {})
      } else {
        v.pause?.()
      }
    }, { threshold: 0.35 })
    io.observe(v)
    return () => io.disconnect()
  }, [])

  return (
    <video ref={ref} src={visto ? src : undefined} poster={poster || undefined}
      muted loop playsInline preload="none" aria-hidden="true"
      className="absolute inset-0 w-full h-full object-cover" style={estiloEncuadre(pos)} />
  )
}

// Ancho de cada cuadro según el tamaño elegido en el panel.
const ANCHOS = {
  chico:   'w-[calc((100%-0.75rem)/2.6)] sm:w-[calc((100%-2rem)/4.3)] md:w-[calc((100%-3rem)/5.3)] lg:w-[calc((100%-5rem)/6.5)]',
  mediano: 'w-[calc((100%-0.75rem)/2.2)] sm:w-[calc((100%-2rem)/3.3)] md:w-[calc((100%-3rem)/4.3)] lg:w-[calc((100%-5rem)/5.5)]',
  grande:  'w-[calc((100%-0.75rem)/1.6)] sm:w-[calc((100%-2rem)/2.4)] md:w-[calc((100%-3rem)/3.3)] lg:w-[calc((100%-5rem)/4.3)]',
}

// ── Ventana del reel ───────────────────────────────────────
function VisorReel({ items, index, onClose, onGo }) {
  const it = items[index]
  const hayVarios = items.length > 1

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hayVarios) onGo(1)
      if (e.key === 'ArrowLeft' && hayVarios) onGo(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, onGo, hayVarios])

  if (!it) return null
  const fecha = fechaLarga(it.date)
  const embed = it.igCode ? `https://www.instagram.com/${it.igKind || 'reel'}/${it.igCode}/embed/` : ''

  const flecha =
    'hidden md:grid absolute top-1/2 -translate-y-1/2 z-20 place-items-center w-12 h-12 rounded-full bg-white/90 text-slate-900 shadow-lg hover:bg-white'

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-0 md:p-6"
      role="dialog" aria-modal="true" aria-label={it.title || 'Publicación de Instagram'} onClick={onClose}>
      {hayVarios && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); onGo(-1) }} aria-label="Anterior" className={`${flecha} left-4 lg:left-8`}>
            <Icon name="chevron" className="w-5 h-5 rotate-180" />
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onGo(1) }} aria-label="Siguiente" className={`${flecha} right-4 lg:right-8`}>
            <Icon name="chevron" className="w-5 h-5" />
          </button>
        </>
      )}

      <div onClick={(e) => e.stopPropagation()}
        className="relative w-full h-full md:h-[min(88vh,780px)] md:w-auto md:max-w-[min(95vw,1100px)] bg-white md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Cerrar */}
        <button type="button" onClick={onClose} aria-label="Cerrar"
          className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/50 md:bg-slate-100 text-white md:text-slate-700 grid place-items-center hover:bg-black/70 md:hover:bg-slate-200 text-2xl leading-none">
          ×
        </button>

        {/* Video */}
        <div className="relative bg-black shrink-0 w-full h-[62vh] md:h-full md:w-auto md:aspect-[9/16] overflow-hidden">
          {it.videoUrl ? (
            <video key={it.videoUrl} src={it.videoUrl} poster={it.image || undefined} controls autoPlay playsInline
              className="absolute inset-0 w-full h-full object-cover bg-black" style={estiloEncuadre(it.pos)} />
          ) : embed ? (
            // Se recorta el encabezado de 54 px del reproductor de Instagram.
            <iframe key={embed} src={embed} title={it.title || 'Reel de Instagram'} loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture; clipboard-write" allowFullScreen
              scrolling="no"
              className="absolute left-0 w-full border-0 bg-black"
              style={{ top: -54, height: 'calc(100% + 54px + 160px)' }} />
          ) : (
            <img src={it.image} alt={it.title || ''} className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0 md:w-[440px] flex flex-col min-h-0 md:h-full">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 pr-16">
            <a href={PERFIL} target="_blank" rel="noopener noreferrer"
              className="w-11 h-11 shrink-0 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600">
              <span className="block w-full h-full rounded-full bg-white p-1">
                <img src="/icon-symbol.png" alt="CRISTASUR" className="w-full h-full object-contain rounded-full" />
              </span>
            </a>
            <div className="min-w-0">
              <a href={PERFIL} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-900 hover:underline">{CUENTA}</a>
              <div className="text-xs text-slate-500">Mérida · Tanil · Bacalar</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
            {it.title && <h3 className="font-bold text-slate-900 mb-2">{it.title}</h3>}
            {it.text
              ? <TextoReel texto={it.text} />
              : <p className="text-slate-400 text-sm">Míralo completo en Instagram.</p>}
          </div>

          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-3">
            <span className="text-sm text-slate-500">{fecha}</span>
            <div className="flex items-center gap-2">
              {hayVarios && (
                <span className="md:hidden flex gap-1">
                  <button type="button" onClick={() => onGo(-1)} aria-label="Anterior"
                    className="w-9 h-9 rounded-full border border-slate-200 grid place-items-center">
                    <Icon name="chevron" className="w-4 h-4 rotate-180" />
                  </button>
                  <button type="button" onClick={() => onGo(1)} aria-label="Siguiente"
                    className="w-9 h-9 rounded-full border border-slate-200 grid place-items-center">
                    <Icon name="chevron" className="w-4 h-4" />
                  </button>
                </span>
              )}
              {it.href && (
                <a href={it.href} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700">
                  <IconoInstagram className="w-4 h-4" /> Ver en Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Fila de reels ──────────────────────────────────────────
export default function ReelsStrip({ items = [], tamano = 'mediano' }) {
  const trackRef = useRef(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [abierto, setAbierto] = useState(-1)

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

  const cerrar = useCallback(() => setAbierto(-1), [])
  const pasar = useCallback(
    (dir) => setAbierto((i) => (i < 0 ? i : (i + dir + items.length) % items.length)),
    [items.length]
  )

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
              className={`snap-start shrink-0 ${ANCHOS[tamano] || ANCHOS.mediano}`}
            >
              <button type="button" onClick={() => setAbierto(i)} aria-label={`Ver: ${label}`}
                className="group relative block w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300">
                {it.videoUrl ? (
                  <div className="absolute inset-0 overflow-hidden transition-transform duration-500 group-hover:scale-[1.03]">
                    <VideoCuadro src={it.videoUrl} poster={it.image} pos={it.pos} />
                  </div>
                ) : it.image ? (
                  <div className="absolute inset-0 overflow-hidden transition-transform duration-500 group-hover:scale-[1.03]">
                    <img src={it.image} alt={label} loading="lazy" referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover" style={estiloEncuadre(it.pos)} />
                  </div>
                ) : (
                  // Sin portada todavía: cuadro neutro con el ícono de Instagram.
                  <div className="absolute inset-0 bg-slate-100 grid place-items-center text-slate-300">
                    <IconoInstagram className="w-10 h-10" />
                  </div>
                )}
              </button>
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

      {abierto >= 0 && <VisorReel items={items} index={abierto} onClose={cerrar} onGo={pasar} />}
    </div>
  )
}
