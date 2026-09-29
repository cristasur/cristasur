'use client'
// ============================================================
// src/components/home/Resenas.jsx
// Reseñas de clientes.
//
// Encabezado centrado (texto chico + CRISTASUR grande + subtítulo),
// carrusel de tarjetas con foto de fondo (item.bg) y la reseña en un
// recuadro blanco encima a la derecha. 3 a la vista en compu, 1 en
// celular (se desliza con el dedo). Flechas y puntos abajo, y el
// sello de Google que lleva a las reseñas (data.reviewsUrl).
// ============================================================
import { useEffect, useRef, useState } from 'react'
import Icon from '@/components/Icon'
import { estiloEncuadre } from '@/lib/encuadre'

// Si no se capturó link, se abre la ficha de la Matriz en Google Maps.
const MAPS_MATRIZ = 'https://maps.app.goo.gl/Cy1Va8jFSt4GvVmr7'

// Fondos de respaldo cuando la reseña no tiene foto.
const FONDOS = [
  'bg-gradient-to-br from-stone-300 via-stone-200 to-amber-100',
  'bg-gradient-to-br from-slate-400 via-slate-300 to-slate-200',
  'bg-gradient-to-br from-sky-200 via-slate-200 to-stone-200',
]

function LogoGoogle({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function Stars({ value = 5, className = 'w-4 h-4' }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0))
  return (
    <div className="flex items-center gap-0.5" aria-label={`${v} de 5 estrellas`} role="img">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i)) // relleno parcial (4.8)
        return (
          <span key={i} className={`relative inline-block ${className}`}>
            <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full text-slate-200" fill="currentColor" aria-hidden="true">
              <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" className={`${className} text-amber-400`} fill="currentColor" aria-hidden="true">
                <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
              </svg>
            </span>
          </span>
        )
      })}
    </div>
  )
}

function Tarjeta({ item, i }) {
  const inicial = (item.author || 'C').trim().charAt(0).toUpperCase()
  return (
    <figure className="relative h-full min-h-[250px] md:min-h-[270px] rounded-2xl overflow-hidden shadow-card flex items-center justify-end p-3 md:p-4">
      {item.bg ? (
        <img src={item.bg} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={estiloEncuadre(item.bgPos)} />
      ) : (
        <div className={`absolute inset-0 ${FONDOS[i % FONDOS.length]}`} aria-hidden="true" />
      )}

      <div className="relative w-[64%] sm:w-[60%] rounded-xl bg-white/95 backdrop-blur-sm shadow-lg p-4 md:p-5 flex flex-col">
        <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-200" fill="currentColor" aria-hidden="true">
          <path d="M9.5 6C6 6 4 8.7 4 12.2V18h6v-6H7c0-2.2 1-3.6 2.5-3.9V6zm10 0C16 6 14 8.7 14 12.2V18h6v-6h-3c0-2.2 1-3.6 2.5-3.9V6z" />
        </svg>
        <div className="mt-1"><Stars value={item.stars || 5} className="w-4 h-4" /></div>
        <blockquote className="mt-2 text-[13px] md:text-sm text-slate-700 leading-snug line-clamp-5">{item.text}</blockquote>
        <figcaption className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2.5">
          <span className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 text-white text-sm font-black grid place-items-center shrink-0" aria-hidden="true">
            {item.image
              ? <img src={item.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={estiloEncuadre(item.pos)} />
              : inicial}
          </span>
          <div className="leading-tight min-w-0">
            <div className="text-[13px] font-bold text-slate-900 truncate">{item.author || 'Cliente CRISTASUR'}</div>
            {item.place && <div className="text-[11px] text-slate-500 truncate">{item.place}</div>}
          </div>
        </figcaption>
      </div>
    </figure>
  )
}

export default function Resenas({ items = [], data = {}, title = '', subtitle = '' }) {
  const pista = useRef(null)
  const [pagina, setPagina] = useState(0)
  const [paginas, setPaginas] = useState(1)
  const n = items.length

  // Cuántas "páginas" hay según cuántas tarjetas caben (3 compu, 1 celular)
  useEffect(() => {
    const el = pista.current
    if (!el) return
    const medir = () => {
      const tarjeta = el.firstElementChild
      if (!tarjeta) return
      const paso = tarjeta.getBoundingClientRect().width + 24
      const visibles = Math.max(1, Math.round((el.clientWidth + 24) / paso))
      setPaginas(Math.max(1, n - visibles + 1))
      setPagina(Math.min(n - 1, Math.round(el.scrollLeft / paso)))
    }
    medir()
    el.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => { el.removeEventListener('scroll', medir); window.removeEventListener('resize', medir) }
  }, [n])

  function ir(p) {
    const el = pista.current
    if (!el?.firstElementChild) return
    const paso = el.firstElementChild.getBoundingClientRect().width + 24
    const destino = (p + paginas) % paginas // da la vuelta
    el.scrollTo({ left: destino * paso, behavior: 'smooth' })
  }

  if (!n) return null
  const rating = Number(data.rating) || 0
  const flecha = 'w-10 h-10 rounded-full bg-white text-slate-900 border border-slate-200 shadow-sm grid place-items-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors'

  return (
    <div className="relative">
      {/* Manchas suaves de fondo */}
      <div className="pointer-events-none absolute -left-24 top-10 w-72 h-72 rounded-full bg-amber-100/50 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-0 w-80 h-80 rounded-full bg-sky-100/60 blur-3xl" aria-hidden="true" />

      <header className="relative text-center mb-8 md:mb-10">
        <div className="text-[11px] md:text-xs font-bold tracking-[0.25em] uppercase text-slate-500">
          {title || 'Lo que dicen nuestros clientes'}
        </div>
        <h2 className="mt-1 text-4xl md:text-5xl font-black text-slate-900 tracking-tight">CRISTASUR</h2>
        <div className="mx-auto mt-2 h-0.5 w-16 bg-amber-400 rounded-full" aria-hidden="true" />
        <p className="mt-3 text-slate-500 text-sm md:text-base">
          {subtitle || 'Equipando hogares, negocios y profesionales en toda la región.'}
        </p>
      </header>

      <div
        ref={pista}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Reseñas de clientes"
        className={`relative flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${n < 3 ? 'md:justify-center' : ''}`}
      >
        {items.map((it, i) => (
          <div key={it._id || i} className="snap-start shrink-0 w-[88%] sm:w-[60%] md:w-[calc((100%-3rem)/3)]">
            <Tarjeta item={it} i={i} />
          </div>
        ))}
      </div>

      {paginas > 1 && (
        <div className="relative mt-6 flex items-center justify-center gap-4">
          <button type="button" onClick={() => ir(pagina - 1)} aria-label="Reseña anterior" className={flecha}>
            <Icon name="arrow" className="w-4 h-4 rotate-180" />
          </button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: paginas }, (_, i) => (
              <button key={i} type="button" onClick={() => ir(i)} aria-label={`Ver reseña ${i + 1}`} aria-current={i === pagina}
                className={`h-2 rounded-full transition-all ${i === Math.min(pagina, paginas - 1) ? 'w-6 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-400'}`} />
            ))}
          </div>
          <button type="button" onClick={() => ir(pagina + 1)} aria-label="Siguiente reseña" className={flecha}>
            <Icon name="arrow" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sello de Google */}
      <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={data.reviewsUrl || MAPS_MATRIZ}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-3 rounded-2xl bg-white border border-slate-200 shadow-card px-4 py-3 hover:shadow-card-hover transition-shadow"
        >
          <LogoGoogle className="w-9 h-9 shrink-0" />
          <div className="leading-tight">
            <div className="text-[12px] font-semibold text-slate-600">Reseñas en Google</div>
            <div className="mt-0.5 flex items-center gap-2">
              {rating > 0 && <span className="text-lg font-black text-slate-900 tabular-nums">{rating.toFixed(1)}</span>}
              <Stars value={rating || 5} className="w-4 h-4" />
            </div>
          </div>
          <span className="ml-1 pl-4 border-l border-slate-200 self-stretch flex items-center text-[13px] font-semibold text-brand-700 gap-1 group-hover:gap-2 transition-all">
            Ver todas las reseñas <Icon name="arrow" className="w-4 h-4" />
          </span>
        </a>
        {data.writeUrl && (
          <a href={data.writeUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-brand-700 text-white text-sm font-bold px-5 py-3 transition-colors">
            <Icon name="edit" className="w-4 h-4" />
            Dejar una reseña
          </a>
        )}
      </div>
    </div>
  )
}
