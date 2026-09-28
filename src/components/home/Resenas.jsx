'use client'
// ============================================================
// src/components/home/Resenas.jsx
// Reseñas / experiencias de clientes.
//
// Carrusel con la tarjeta del centro resaltada (sombra, opacidad
// completa) y las de los lados atenuadas; flechas y puntos. Da la
// vuelta infinita. En celular se ve solo la del centro.
// Debajo, resumen estilo Google: calificación (data.rating), texto y
// botones "Ver reseñas" (data.reviewsUrl) y "Dejar una reseña"
// (data.writeUrl), cada uno solo si está configurado.
// ============================================================
import { useState } from 'react'
import Icon from '@/components/Icon'
import { estiloEncuadre } from '@/lib/encuadre'

// Si no se capturó link, se abre la ficha de la Matriz en Google Maps.
const MAPS_MATRIZ = 'https://maps.app.goo.gl/Cy1Va8jFSt4GvVmr7'

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
        // Relleno parcial para calificaciones como 4.8
        const fill = Math.max(0, Math.min(1, v - i))
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

function ReviewCard({ item, highlighted, onClick }) {
  const initial = (item.author || 'C').trim().charAt(0).toUpperCase()
  return (
    <figure
      onClick={onClick}
      className={`h-full rounded-2xl bg-white border p-6 md:p-7 flex flex-col transition-all duration-500
        ${highlighted
          ? 'border-slate-100 shadow-card-hover opacity-100 md:scale-100'
          : 'border-slate-100 opacity-45 md:scale-[0.94] cursor-pointer hover:opacity-70'}`}
    >
      <Stars value={item.stars || 5} />
      <svg viewBox="0 0 24 24" className="w-8 h-8 mt-4 text-brand-100" fill="currentColor" aria-hidden="true">
        <path d="M9.5 6C6 6 4 8.7 4 12.2V18h6v-6H7c0-2.2 1-3.6 2.5-3.9V6zm10 0C16 6 14 8.7 14 12.2V18h6v-6h-3c0-2.2 1-3.6 2.5-3.9V6z" />
      </svg>
      <blockquote className="mt-2 text-slate-700 leading-relaxed flex-1 line-clamp-6">{item.text}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="relative w-11 h-11 rounded-full overflow-hidden bg-brand-600 text-white font-black grid place-items-center shrink-0" aria-hidden="true">
          {item.image
            ? <img src={item.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" style={estiloEncuadre(item.pos)} />
            : initial}
        </span>
        <div className="leading-tight min-w-0">
          <div className="font-bold text-slate-900 truncate">{item.author || 'Cliente CRISTASUR'}</div>
          {item.place && <div className="text-xs text-slate-500 truncate">{item.place}</div>}
        </div>
      </figcaption>
    </figure>
  )
}

export default function Resenas({ items = [], data = {} }) {
  const [idx, setIdx] = useState(0)
  const n = items.length
  if (!n) return null

  const go = (d) => setIdx((i) => (i + d + n) % n)
  const prevI = (idx - 1 + n) % n
  const nextI = (idx + 1) % n

  const rating = Number(data.rating) || 0

  const arrowCls =
    'w-11 h-11 rounded-full bg-white text-slate-900 border border-slate-200 grid place-items-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors'

  return (
    <div>
      <div className="relative" role="region" aria-roledescription="carrusel" aria-label="Reseñas de clientes">
        {/* Tres tarjetas en compu (anterior, actual, siguiente); una en celular */}
        <div className={`grid gap-4 md:gap-6 items-stretch ${n >= 3 ? 'md:grid-cols-3' : n === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' : 'max-w-xl mx-auto'}`}>
          {n >= 3 && (
            <div className="hidden md:block">
              <ReviewCard key={`p-${prevI}`} item={items[prevI]} onClick={() => go(-1)} />
            </div>
          )}
          <div className="animate-fade-in-up" key={`c-${idx}`} aria-live="polite">
            <ReviewCard item={items[idx]} highlighted />
          </div>
          {n >= 2 && (
            <div className="hidden md:block">
              <ReviewCard key={`n-${nextI}`} item={items[nextI]} onClick={() => go(1)} />
            </div>
          )}
        </div>

        {n > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button type="button" onClick={() => go(-1)} aria-label="Reseña anterior" className={arrowCls}>
              <Icon name="chevron" className="w-5 h-5 rotate-180" />
            </button>
            <div className="flex items-center gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Ver reseña ${i + 1}`}
                  aria-current={i === idx}
                  className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-slate-900' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                />
              ))}
            </div>
            <button type="button" onClick={() => go(1)} aria-label="Siguiente reseña" className={arrowCls}>
              <Icon name="chevron" className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Sello de Google: todo el recuadro lleva a las reseñas */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={data.reviewsUrl || MAPS_MATRIZ}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-4 rounded-2xl bg-white border border-slate-200 shadow-card px-5 py-4 hover:border-slate-300 hover:shadow-card-hover transition-all"
        >
          <LogoGoogle className="w-10 h-10 shrink-0" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-900">Reseñas en Google</div>
            <div className="mt-1 flex items-center gap-2">
              {rating > 0 && <span className="text-lg font-black text-slate-900 tabular-nums">{rating.toFixed(1)}</span>}
              <Stars value={rating || 5} className="w-4 h-4" />
            </div>
          </div>
          <span className="ml-2 text-sm font-semibold text-brand-700 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver reseñas <Icon name="arrow" className="w-4 h-4" />
          </span>
        </a>
        {data.writeUrl && (
          <a
            href={data.writeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-brand-700 text-white text-sm font-bold px-5 py-3 transition-colors"
          >
            <Icon name="edit" className="w-4 h-4" />
            Dejar una reseña
          </a>
        )}
      </div>
    </div>
  )
}
