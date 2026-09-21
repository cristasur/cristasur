// ============================================================
// LineVariants — "Variantes de la línea"
//
// Miniaturas de los productos HERMANOS de la misma colección: el
// plato de 28 cm, el de 26, el tazón, la taza. No son variantes
// embebidas (cada uno tiene su precio, su SKU y su caja); son
// productos distintos entre los que el cliente quiere saltar sin
// volver al catálogo.
//
// Se agrupan por el campo `line` del producto y se etiquetan con
// `lineLabel` ("28 cm", "350 ml"), ambos capturados en el admin.
//
// Server component: son enlaces, no necesita estado.
// ============================================================
import Link from 'next/link'

export default function LineVariants({ line, current, siblings = [] }) {
  if (!line || siblings.length === 0) return null

  // El producto actual va primero para que se vea dónde está parado.
  const items = [
    { ...current, esActual: true },
    ...siblings.filter((s) => String(s._id) !== String(current._id)),
  ]

  return (
    <div className="mt-5">
      <div className="text-[13px] text-slate-500 mb-2.5">
        <span className="font-semibold text-slate-700">Variantes de la línea</span>
        <span className="mx-1.5 text-slate-300">·</span>
        <span>{line}</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scroll-chip">
        {items.map((p) => {
          const etiqueta = p.lineLabel || p.name
          const contenido = (
            <>
              <div className="w-[62px] h-[62px] rounded-md overflow-hidden bg-slate-50 grid place-items-center">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={etiqueta}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 px-1 text-center leading-tight">
                    {etiqueta}
                  </span>
                )}
              </div>
              <span className="block text-[10.5px] leading-tight text-center mt-1 px-0.5 line-clamp-2">
                {etiqueta}
              </span>
            </>
          )

          // El actual no es enlace: ya estás ahí.
          if (p.esActual) {
            return (
              <div
                key={String(p._id)}
                aria-current="true"
                className="shrink-0 w-[72px] p-1 rounded-lg border-2 border-slate-900 text-slate-900"
              >
                {contenido}
              </div>
            )
          }

          return (
            <Link
              key={String(p._id)}
              href={`/productos/${p._id}`}
              className="shrink-0 w-[72px] p-1 rounded-lg border-2 border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-900 transition-colors"
            >
              {contenido}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
