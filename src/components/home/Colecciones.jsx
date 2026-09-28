'use client'
// ============================================================
// src/components/home/Colecciones.jsx
// Colecciones destacadas: a la izquierda la lista de nombres en
// letra muy grande (la activa en negro y subrayada, las demás en
// gris claro), las miniaturas de sus productos, su texto y el botón
// "Ver todos". A la derecha la foto grande de la colección activa.
// Pasar el mouse o tocar un nombre la vuelve activa.
// ============================================================
import { useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/Icon'

const isExternal = (href = '') => /^https?:\/\//i.test(href)

function SmartLink({ href, className, children, ...rest }) {
  if (isExternal(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>{children}</a>
  }
  return <Link href={href} className={className} {...rest}>{children}</Link>
}

export default function Colecciones({ label = 'Colecciones destacadas', subtitle, items = [] }) {
  // Empieza en la primera colección que tenga foto.
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((it) => it.image)))
  if (!items.length) return null
  const current = items[active] || items[0]
  const thumbs = (current.products || []).slice(0, 4)

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-start">
      {/* ── Izquierda: lista + detalle ── */}
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-widest font-bold text-brand-600">{label}</div>
        {subtitle && <p className="text-slate-500 mt-1 text-sm md:text-base">{subtitle}</p>}

        <ul className="mt-4 space-y-1" role="tablist" aria-label={label}>
          {items.map((it, i) => {
            const on = i === active
            return (
              <li key={it._id || i}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className={`text-left text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15] transition-colors
                    underline-offset-[10px] decoration-[5px]
                    ${on ? 'text-slate-900 underline decoration-slate-900' : 'text-slate-300 hover:text-slate-500'}`}
                >
                  {it.title}
                </button>
              </li>
            )
          })}
        </ul>

        {/* Foto en celular (debajo de la lista) */}
        {current.image && (
          <div className="lg:hidden mt-6 aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
            <img key={current.image} src={current.image} alt={current.title} loading="lazy" className="w-full h-full object-cover animate-fade-in-up" />
          </div>
        )}

        <div key={active} className="mt-8 animate-fade-in-up">
          {thumbs.length > 0 && (
            <div className="flex gap-3">
              {thumbs.map((p) => (
                <Link
                  key={p._id}
                  href={`/productos/${p._id}`}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 hover:border-slate-300 transition-colors shrink-0"
                  title={p.name}
                >
                  <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                </Link>
              ))}
            </div>
          )}

          {current.text && <p className="mt-5 text-slate-600 leading-relaxed max-w-lg">{current.text}</p>}

          {current.href && (
            <SmartLink
              href={current.href}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 transition-colors"
            >
              Ver todos
              <Icon name="arrow" className="w-4 h-4" />
            </SmartLink>
          )}
        </div>
      </div>

      {/* ── Derecha: foto grande con transición ── */}
      <div className="hidden lg:block relative aspect-[4/5] xl:aspect-square rounded-2xl overflow-hidden bg-slate-100">
        {items.map((it, i) =>
          it.image ? (
            <img
              key={it._id || i}
              src={it.image}
              alt={it.title}
              loading="lazy"
              aria-hidden={i !== active}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0'}`}
            />
          ) : null
        )}
        {!current.image && (
          <div className="absolute inset-0 grid place-items-center bg-brand-50 text-brand-300">
            <Icon name="grid" className="w-16 h-16" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  )
}
