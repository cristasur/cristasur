// ============================================================
// src/components/home/PromosDobles.jsx
// Dos promociones lado a lado (items[0..1]) con sello naranja de
// descuento, y debajo (opcional) el banner de marca (items[2]) con
// un texto a su lado (data.textoTitulo, data.texto, data.boton →
// data.botonHref).
// ============================================================
import Link from 'next/link'
import Icon from '@/components/Icon'

const isExternal = (href = '') => /^https?:\/\//i.test(href)

function Tile({ href, label, className = '', children }) {
  const cls = `group relative block overflow-hidden rounded-2xl bg-slate-100 ${className}`
  if (!href) return <div className={cls}>{children}</div>
  if (isExternal(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>{children}</a>
  }
  return <Link href={href} aria-label={label} className={cls}>{children}</Link>
}

function SmartLink({ href, className, children }) {
  if (isExternal(href)) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  }
  return <Link href={href} className={className}>{children}</Link>
}

const imgCls = 'absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'

function PromoTile({ item }) {
  return (
    <Tile href={item.href} label={item.title || 'Ver promoción'} className="aspect-[4/3] sm:aspect-[16/11]">
      {item.image ? (
        <img src={item.image} alt={item.title || 'Promoción CRISTASUR'} loading="lazy" className={imgCls} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Sello de descuento */}
      {item.badge && (
        <div className="absolute top-4 right-4 md:top-5 md:right-5 w-20 h-20 md:w-24 md:h-24 rounded-full bg-accent-500 text-white grid place-items-center text-center shadow-lg ring-4 ring-white/30 rotate-6 group-hover:rotate-0 transition-transform">
          <div className="leading-none">
            {item.badgeLabel && <div className="text-[10px] md:text-xs font-bold uppercase tracking-wide">{item.badgeLabel}</div>}
            <div className="text-2xl md:text-3xl font-black mt-0.5">{item.badge}</div>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 text-white">
        {item.title && <h3 className="text-2xl md:text-3xl font-black leading-tight tracking-tight max-w-sm">{item.title}</h3>}
        {item.subtitle && <p className="mt-1.5 text-sm md:text-base text-white/85 max-w-sm">{item.subtitle}</p>}
        {item.href && (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white text-slate-900 group-hover:bg-accent-500 group-hover:text-white text-xs md:text-sm font-bold px-4 py-2 transition-colors">
            Ver más
            <Icon name="arrow" className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </Tile>
  )
}

export default function PromosDobles({ items = [], data = {} }) {
  const promos = items.slice(0, 2).filter((it) => it && (it.image || it.title))
  const brand = items[2]?.image ? items[2] : null
  const hasText = data.textoTitulo || data.texto || (data.boton && data.botonHref)

  return (
    <div className="space-y-4 md:space-y-6">
      {promos.length > 0 && (
        <div className={`grid gap-4 md:gap-6 ${promos.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {promos.map((it, i) => <PromoTile key={it._id || i} item={it} />)}
        </div>
      )}

      {brand && (
        <div className={`grid gap-4 md:gap-10 items-center ${hasText ? 'md:grid-cols-2' : ''}`}>
          <Tile href={brand.href} label={brand.title || 'CRISTASUR'} className="aspect-[16/10]">
            <img src={brand.image} alt={brand.title || 'CRISTASUR'} loading="lazy" className={imgCls} />
            <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-white">
              <div>
                {brand.title && (
                  <h3 className="font-serif italic text-3xl sm:text-4xl md:text-5xl leading-tight drop-shadow">{brand.title}</h3>
                )}
                {brand.subtitle && (
                  <p className="mt-2 text-xs md:text-sm uppercase tracking-[0.25em] font-bold text-white/85">{brand.subtitle}</p>
                )}
              </div>
            </div>
          </Tile>

          {hasText && (
            <div className="md:py-6">
              {data.textoTitulo && (
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight tracking-tight">{data.textoTitulo}</h3>
              )}
              {data.texto && (
                <p className="mt-4 text-slate-600 leading-relaxed whitespace-pre-line">{data.texto}</p>
              )}
              {data.boton && data.botonHref && (
                <SmartLink
                  href={data.botonHref}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-brand-700 text-white text-sm font-bold px-6 py-3 transition-colors"
                >
                  {data.boton}
                  <Icon name="arrow" className="w-4 h-4" />
                </SmartLink>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
