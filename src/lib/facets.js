// ============================================================
// Filtrado por facetas — atributos dinámicos sacados de la ficha
// técnica (`specs`) de los productos.
//
// La idea: no hay que declarar "Acabado", "Forma" o "Tipo de plato"
// en ningún lado. Si el admin captura esas filas en la ficha técnica,
// aparecen solas como filtros en las categorías donde existan, con
// su conteo de productos.
//
// Formato en la URL: un parámetro `spec` repetido, con `~` separando
// etiqueta y valor:
//
//   /categoria/platos?spec=Acabado~Mate&spec=Acabado~Brillante&spec=Forma~Redondo
//
// Lógica de combinación (la estándar en tiendas):
//   · OR dentro de una misma etiqueta  (Mate o Brillante)
//   · AND entre etiquetas distintas    (… y además Redondo)
// ============================================================

const SEP = '~'
const MIN_VALUES = 2   // una faceta con un solo valor no filtra nada
const MAX_FACETS = 12
const MAX_VALUES_PER_FACET = 40

/**
 * Lee los parámetros `spec` del URL y los agrupa por etiqueta.
 * Devuelve { 'Acabado': ['Mate', 'Brillante'], 'Forma': ['Redondo'] }
 */
export function parseSpecParams(searchParams) {
  const raw = searchParams?.spec
  if (!raw) return {}
  const list = Array.isArray(raw) ? raw : [raw]

  const out = {}
  for (const entry of list) {
    const str = String(entry || '')
    const i = str.indexOf(SEP)
    if (i <= 0) continue
    const label = str.slice(0, i).trim()
    const value = str.slice(i + 1).trim()
    if (!label || !value) continue
    if (!out[label]) out[label] = []
    if (!out[label].includes(value)) out[label].push(value)
  }
  return out
}

/**
 * Convierte las facetas seleccionadas en condiciones de Mongo.
 * Se devuelve un array para meterlo en un `$and`.
 */
export function specFilterClauses(selected) {
  return Object.entries(selected || {}).map(([label, values]) => ({
    specs: { $elemMatch: { label, value: { $in: values } } },
  }))
}

/**
 * Agrega las facetas disponibles para un conjunto de productos.
 *
 * `baseFilter` debe traer todos los filtros activos MENOS los de
 * facetas: así los conteos no se desploman a 1 en cuanto el cliente
 * marca una casilla, que es el comportamiento que espera la gente.
 *
 * Devuelve: [{ label, values: [{ value, count }] }]
 */
export async function buildFacets(Product, baseFilter) {
  const rows = await Product.aggregate([
    { $match: baseFilter },
    { $unwind: '$specs' },
    {
      $group: {
        _id: { label: '$specs.label', value: '$specs.value' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.label',
        values: { $push: { value: '$_id.value', count: '$count' } },
        distinct: { $sum: 1 },
        total: { $sum: '$count' },
      },
    },
    // Solo sirven como filtro las que tienen al menos dos valores.
    { $match: { distinct: { $gte: MIN_VALUES } } },
    { $sort: { total: -1, _id: 1 } },
    { $limit: MAX_FACETS },
  ])

  return rows.map((r) => ({
    label: r._id,
    values: r.values
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'es'))
      .slice(0, MAX_VALUES_PER_FACET),
  }))
}

/** Arma el valor que va en la URL para una casilla. */
export function specParamValue(label, value) {
  return `${label}${SEP}${value}`
}

/** Cuántas casillas de faceta hay marcadas en total. */
export function countSelectedSpecs(selected) {
  return Object.values(selected || {}).reduce((n, vals) => n + vals.length, 0)
}
