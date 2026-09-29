// ============================================================
// Padres de una categoría.
//
// Una subcategoría puede estar dentro de VARIAS categorías
// principales (ej. "Charolas" en Vajilla y en Para tu negocio).
// Se guardan en `parents` (arreglo). `parent` se conserva con el
// primero de la lista para lo que solo necesita uno (migas de pan)
// y para las categorías viejas que solo tenían `parent`.
// ============================================================
const idDe = (x) => (x && typeof x === 'object' && x._id ? String(x._id) : x ? String(x) : '')

/** Ids (string) de todos los padres de la categoría, sin repetir. */
export function padresDe(c) {
  const s = new Set()
  if (c?.parent) s.add(idDe(c.parent))
  for (const p of c?.parents || []) if (p) s.add(idDe(p))
  s.delete('')
  return [...s]
}

export const esPrincipal = (c) => padresDe(c).length === 0
export const esHijaDe = (c, id) => padresDe(c).includes(String(id))

/** Filtro de Mongo: categorías hijas de cualquiera de estos ids. */
export const filtroHijasDe = (ids) => {
  const lista = Array.isArray(ids) ? ids : [ids]
  return { $or: [{ parent: { $in: lista } }, { parents: { $in: lista } }] }
}
