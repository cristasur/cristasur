// ============================================================
// CategoryHero — banner de la landing de una categoría.
//
// La foto va a sangre y el color entra como degradado desde la
// izquierda (desde abajo en móvil). Nada de cortes duros: un
// clip-path parte la foto a la mitad y se ve barato.
//
// Encima, una viñeta suave oscurece las orillas para que la foto
// no se vea quemada y el texto siempre tenga contraste, sea cual
// sea la imagen que suba el admin.
//
// Si la categoría no tiene foto, el panel se llena con el color,
// la trama de puntos y un halo naranja.
//
// El color se elige por categoría en el admin (bannerColor).
// ============================================================
import { categoryColor } from '@/lib/categoryColors'

export default function CategoryHero({ category, parentCat, total }) {
  const { bg } = categoryColor(category?.bannerColor)
  const hasImage = Boolean(category?.image)

  const kicker = parentCat?.name || 'Catálogo'

  const Content = (
    <div className="relative px-6 sm:px-10 md:px-12 py-10 md:py-14 max-w-lg">
      {/* Pastilla con el conteo: da peso al bloque aunque la
          categoría no tenga descripción. */}
      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 mb-4 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
        <span className="text-[10.5px] uppercase tracking-[0.16em] font-bold text-white/85">
          {Number.isFinite(total)
            ? `${total} ${total === 1 ? 'producto' : 'productos'}`
            : kicker}
        </span>
      </div>

      <h1 className="text-[34px] sm:text-[44px] md:text-[54px] font-black uppercase leading-[0.92] tracking-tight text-white break-words">
        {category.name}
      </h1>

      {category.description ? (
        <p className="mt-4 md:mt-5 text-[14.5px] md:text-[15.5px] text-white/70 leading-relaxed line-clamp-3">
          {category.description}
        </p>
      ) : (
        <div className="w-14 h-[5px] rounded-full bg-accent-500 mt-5" />
      )}
    </div>
  )

  // ── Sin foto ────────────────────────────────────────────
  if (!hasImage) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden flex items-center min-h-[220px] md:min-h-[260px]"
        style={{ backgroundColor: bg }}
      >
        <div className="absolute inset-0 bg-dots opacity-25 pointer-events-none" />
        <div
          className="absolute pointer-events-none"
          style={{
            right: '-140px', top: '-140px', width: 440, height: 440,
            borderRadius: '9999px', background: 'rgba(249,115,22,0.22)', filter: 'blur(70px)',
          }}
        />
        {Content}
      </div>
    )
  }

  // ── Con foto ────────────────────────────────────────────
  return (
    <div className="relative rounded-2xl overflow-hidden flex items-center min-h-[300px] md:min-h-[380px]">
      <img
        src={category.image}
        alt={category.name}
        // Es el LCP de la landing.
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Degradado del color de la categoría.
          Escritorio: entra desde la izquierda. Móvil: desde abajo. */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background: `linear-gradient(to top, ${bg} 0%, ${bg}e6 34%, ${bg}8c 56%, transparent 85%)`,
        }}
      />
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background: `linear-gradient(95deg, ${bg}fa 0%, ${bg}e6 34%, ${bg}8c 52%, transparent 76%)`,
        }}
      />

      {/* Viñeta: apaga las orillas de la foto para que no se queme */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 90% at 70% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      <div className="relative w-full flex items-end md:items-center min-h-[300px] md:min-h-[380px]">
        {Content}
      </div>
    </div>
  )
}
