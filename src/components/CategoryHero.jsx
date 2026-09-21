// ============================================================
// CategoryHero — banner de la landing de una categoría.
//
// Es deliberadamente hermano de los banners del inicio: panel de
// color sólido con trama de puntos, corte diagonal, tipografía
// alineada a la izquierda y regla naranja. Ese es el lenguaje
// visual de CRISTASUR y debe repetirse en todo el sitio.
//
// Escritorio: el panel se recorta en diagonal sobre la foto.
// Móvil: foto arriba, panel completo abajo (la diagonal no se
// lee bien en pantallas angostas).
//
// El color se elige por categoría en el admin (bannerColor).
// ============================================================
import { categoryColor } from '@/lib/categoryColors'

export default function CategoryHero({ category, parentCat, total }) {
  const { bg } = categoryColor(category?.bannerColor)
  const hasImage = Boolean(category?.image)

  const Panel = ({ diagonal }) => (
    <div
      className={
        diagonal
          ? 'absolute inset-y-0 left-0 w-full md:w-[64%] flex items-center'
          : 'relative flex items-center'
      }
      style={{
        backgroundColor: bg,
        // El corte diagonal solo en escritorio y solo si hay foto detrás.
        clipPath: diagonal ? 'polygon(0 0, 100% 0, 78% 100%, 0 100%)' : undefined,
      }}
    >
      {/* Trama de puntos: la misma textura de los banners del inicio */}
      <div className="absolute inset-0 bg-dots opacity-[0.18] pointer-events-none" />

      <div className="relative px-6 sm:px-10 md:pl-12 md:pr-24 py-10 md:py-12 max-w-xl">
        {parentCat && (
          <div className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/60 mb-2">
            {parentCat.name}
          </div>
        )}

        <h1 className="text-[32px] sm:text-4xl md:text-[52px] font-black uppercase leading-[0.95] tracking-tight text-white break-words">
          {category.name}
        </h1>

        {/* Regla naranja — el acento de marca */}
        <div className="w-16 h-1 rounded bg-accent-500 mt-5" />

        {category.description && (
          <p className="mt-5 text-[14px] md:text-[15px] text-white/75 leading-relaxed line-clamp-3">
            {category.description}
          </p>
        )}

        {Number.isFinite(total) && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 backdrop-blur">
            <span className="text-[13px] font-bold text-white">{total}</span>
            <span className="text-[13px] text-white/70">
              {total === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        )}
      </div>
    </div>
  )

  // Sin foto: el panel ocupa todo, sin diagonal.
  if (!hasImage) {
    return (
      <div className="rounded-2xl overflow-hidden">
        <Panel diagonal={false} />
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden">
      {/* ── Móvil: foto arriba, panel abajo ── */}
      <div className="md:hidden">
        <div className="relative aspect-[16/9] bg-slate-100">
          <img
            src={category.image}
            alt={category.name}
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <Panel diagonal={false} />
      </div>

      {/* ── Escritorio: panel diagonal sobre la foto ── */}
      <div className="hidden md:block relative min-h-[320px]">
        <img
          src={category.image}
          alt={category.name}
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <Panel diagonal />
      </div>
    </div>
  )
}
