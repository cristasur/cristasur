// ============================================================
// src/components/home/HomeSections.jsx
// Pinta los bloques de portada (HomeSection) en su orden.
// Cada tipo tiene su componente; los bloques sin nada que mostrar
// (carrusel sin productos, reels sin fotos, etc.) se omiten para
// que la portada nunca tenga huecos vacíos.
// ============================================================
import Link from 'next/link'
import Icon from '@/components/Icon'
import ProductCarousel from './ProductCarousel'
import ReelsStrip from './ReelsStrip'
import Colecciones from './Colecciones'
import Mosaico from './Mosaico'
import PromosDobles from './PromosDobles'
import PorQue from './PorQue'
import Resenas from './Resenas'

const isExternal = (href = '') => /^https?:\/\//i.test(href)

// Contenedor común: mismo ancho y aire vertical en todos los bloques.
export function SectionShell({ children, className = '' }) {
  return <section className={`max-w-7xl mx-auto px-4 py-10 md:py-14 ${className}`}>{children}</section>
}

// Encabezado común: título, subtítulo opcional y "Ver todos ›".
export function SectionHeader({ title, subtitle, href, linkLabel = 'Ver todos' }) {
  if (!title && !subtitle && !href) return null
  const linkCls = 'text-sm font-bold text-slate-900 hover:text-brand-700 inline-flex items-center gap-1 shrink-0 whitespace-nowrap'
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {title && <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{title}</h2>}
        {subtitle && <p className="text-slate-500 mt-1 text-sm md:text-base">{subtitle}</p>}
      </div>
      {href && (isExternal(href) ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkCls}>
          {linkLabel}
          <Icon name="chevron" className="w-4 h-4" />
        </a>
      ) : (
        <Link href={href} className={linkCls}>
          {linkLabel}
          <Icon name="chevron" className="w-4 h-4" />
        </Link>
      ))}
    </div>
  )
}

const withImage = (items) => (items || []).filter((it) => it?.image)

function renderSection(s) {
  const items = s.items || []
  switch (s.type) {
    case 'carrusel': {
      if (!s.products?.length) return null
      return (
        <SectionShell>
          <SectionHeader title={s.title || s.category?.name} subtitle={s.subtitle} href={s.href} />
          <ProductCarousel products={s.products} label={s.title || s.category?.name || 'Productos'} />
        </SectionShell>
      )
    }
    case 'reels': {
      const reels = items.filter((it) => it?.image || it?.videoUrl || it?.igCode)
      if (!reels.length) return null
      return (
        <SectionShell>
          <SectionHeader title={s.title || 'Contenido reciente'} subtitle={s.subtitle} href={s.href} linkLabel="Ver más" />
          <ReelsStrip items={reels} tamano={s.data?.tamano} />
        </SectionShell>
      )
    }
    case 'colecciones': {
      const cols = items.filter((it) => it?.title)
      if (!cols.some((it) => it.image)) return null
      return (
        <SectionShell>
          <Colecciones label={s.title || 'Colecciones destacadas'} subtitle={s.subtitle} items={cols} />
        </SectionShell>
      )
    }
    case 'mosaico': {
      const tiles = withImage(items)
      if (!tiles.length) return null
      return (
        <SectionShell>
          <SectionHeader title={s.title} subtitle={s.subtitle} href={s.href} />
          <Mosaico items={tiles} />
        </SectionShell>
      )
    }
    case 'promos': {
      if (!items.some((it) => it?.image)) return null
      return (
        <SectionShell>
          <SectionHeader title={s.title} subtitle={s.subtitle} href={s.href} />
          <PromosDobles items={items} data={s.data || {}} />
        </SectionShell>
      )
    }
    case 'porque': {
      const reasons = items.filter((it) => it?.title || it?.text)
      if (!reasons.length) return null
      return (
        <SectionShell>
          <PorQue title={s.title} subtitle={s.subtitle} image={s.image} items={reasons} texto={s.data?.texto || ''} />
        </SectionShell>
      )
    }
    case 'resenas': {
      const reviews = items.filter((it) => it?.text)
      if (!reviews.length) return null
      return (
        <div className="overflow-hidden">
          <SectionShell>
            <Resenas items={reviews} data={s.data || {}} title={s.title} subtitle={s.subtitle} />
          </SectionShell>
        </div>
      )
    }
    default:
      return null
  }
}

export default function HomeSections({ sections = [] }) {
  return (
    <div>
      {sections.map((s, i) => {
        const node = renderSection(s)
        return node ? <div key={s._id || i}>{node}</div> : null
      })}
    </div>
  )
}
