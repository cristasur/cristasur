// ============================================================
// CategoryHero — banner de la landing de una categoría.
//
// Dos mitades: bloque de color con "COLECCIÓN" y el nombre a la
// izquierda, y la foto de la categoría a la derecha. El color se
// elige por categoría en el admin (campo bannerColor).
//
// Si la categoría no tiene imagen, el bloque de color ocupa todo
// el ancho y el título se centra.
// ============================================================
import { categoryColor } from '@/lib/categoryColors'

export default function CategoryHero({ category, subtitle }) {
  const { bg, ink } = categoryColor(category?.bannerColor)
  const hasImage = Boolean(category?.image)

  return (
    <div className="rounded-2xl overflow-hidden grid md:grid-cols-2">
      {/* Bloque de color con el título */}
      <div
        className="flex flex-col items-center justify-center text-center px-6 py-12 md:py-0 md:min-h-[340px]"
        style={{ backgroundColor: bg, color: ink }}
      >
        <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] font-semibold opacity-70">
          Colección
        </span>

        <span
          className="block w-24 mt-4 mb-5 border-t"
          style={{ borderColor: ink, opacity: 0.25 }}
        />

        <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight break-words max-w-full">
          {category.name}
        </h1>

        <span
          className="block w-24 mt-5 border-t"
          style={{ borderColor: ink, opacity: 0.25 }}
        />

        {subtitle && (
          <p className="mt-5 text-sm md:text-[15px] opacity-75 max-w-sm">
            {subtitle}
          </p>
        )}
      </div>

      {/* Foto de la categoría */}
      {hasImage && (
        <div className="relative bg-slate-100 min-h-[220px] md:min-h-[340px]">
          <img
            src={category.image}
            alt={category.name}
            // Es el LCP de la landing: se carga con prioridad.
            fetchPriority="high"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      )}
    </div>
  )
}
