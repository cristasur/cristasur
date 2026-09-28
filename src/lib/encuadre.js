// ============================================================
// Encuadre de una imagen dentro de un recuadro (banners).
//
// La imagen siempre llena el recuadro (object-cover). Lo que se
// guarda es QUÉ PARTE se ve:
//   x, y   punto de enfoque en % (0 = izquierda/arriba, 50 = centro,
//          100 = derecha/abajo). Es el object-position de CSS.
//   zoom   1 = tamaño normal, hasta 2.5 = acercado. El acercamiento
//          se hace sobre el punto de enfoque para que no se "vaya".
//
// Se usa igual en el carrusel de la portada y en el editor del
// panel, así lo que ves al ajustar es exactamente lo que sale.
// ============================================================
export const ENCUADRE_CENTRO = { x: 50, y: 50, zoom: 1 }

const limitar = (v, min, max, def) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def
}

export function normalizarEncuadre(e) {
  return {
    x: Math.round(limitar(e?.x, 0, 100, 50) * 10) / 10,
    y: Math.round(limitar(e?.y, 0, 100, 50) * 10) / 10,
    zoom: Math.round(limitar(e?.zoom, 1, 2.5, 1) * 100) / 100,
  }
}

/** Estilo para un <img> con object-cover. */
export function estiloEncuadre(e) {
  const { x, y, zoom } = normalizarEncuadre(e)
  return {
    objectPosition: `${x}% ${y}%`,
    transform: zoom !== 1 ? `scale(${zoom})` : undefined,
    transformOrigin: `${x}% ${y}%`,
  }
}
