// ============================================================
// src/components/home/Mosaico.jsx
// Mosaico: 1 cuadro grande (items[0]) a la izquierda, ocupando dos
// filas, y hasta 4 cuadros chicos (items[1..4]) en 2x2 a la derecha.
// Todos son links; la foto hace un zoom sutil al pasar el mouse.
// En celular: el grande a todo lo ancho y los chicos en 2 columnas.
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

const imgCls = 'absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105'

// Con menos de 4 chicos, los que hay se estiran para no dejar huecos
// en el 2x2 de la derecha (solo en compu).
function spanFor(i, n) {
  if (n === 1) return 'md:col-span-2 md:row-span-2'
  if (n === 2) return 'md:col-span-2'
  if (n === 3 && i === 2) return 'md:col-span-2'
  return ''
}

export default function Mosaico({ items = [] }) {
  const [big, ...rest] = items
  if (!big) return null
  const small = rest.slice(0, 4)
  const hasSmall = small.length > 0

  return (
    <div className={`grid gap-3 md:gap-4 grid-cols-2 ${hasSmall ? 'md:grid-cols-4 md:grid-rows-2' : ''}`}>
      {/* Cuadro grande */}
      <Tile
        href={big.href}
        label={big.title || 'Ver colección'}
        className={`col-span-2 aspect-[4/5] sm:aspect-[16/10] ${hasSmall ? 'md:row-span-2 md:aspect-auto md:min-h-[520px]' : 'md:aspect-[21/9]'}`}
      >
        <img src={big.image} alt={big.title || 'CRISTASUR'} loading="lazy" className={imgCls} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 text-white">
          {big.subtitle && (
            <div className="text-[11px] md:text-xs uppercase tracking-widest font-bold text-white/80">{big.subtitle}</div>
          )}
          {big.title && (
            <h3 className="mt-1 text-3xl md:text-4xl lg:text-5xl font-black leading-[1.05] tracking-tight max-w-md">{big.title}</h3>
          )}
          {big.text && <p className="mt-3 text-sm md:text-base text-white/85 max-w-md leading-relaxed line-clamp-3">{big.text}</p>}
          {big.href && (
            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-600 group-hover:bg-brand-700 text-white text-xs md:text-sm font-bold px-4 py-2 transition-colors">
              Ver todos
              <Icon name="arrow" className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </Tile>

      {/* Cuadros chicos */}
      {small.map((it, i) => (
        <Tile key={it._id || i} href={it.href} label={it.title || `Ver colección ${i + 2}`} className={`aspect-square md:aspect-auto md:min-h-[250px] ${spanFor(i, small.length)}`}>
          <img src={it.image} alt={it.title || 'CRISTASUR'} loading="lazy" className={imgCls} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
          {it.title && (
            <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 text-center text-white font-black text-base md:text-lg leading-tight">
              {it.title}
            </div>
          )}
        </Tile>
      ))}
    </div>
  )
}
