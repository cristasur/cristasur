// ============================================================
// src/lib/catalogo.js
// Búsqueda del catálogo con filtros tipo MAHA (lo usan /productos y
// /categoria/[slug]).
//
// Filtros (en la URL, se pueden repetir para marcar varios):
//   category=<slug>       categoría / subcategoría (incluye sus hijas)
//   brand=<slug>          marca
//   material=<slug>       material
//   color=<nombre>        color (Blanco, Azul…; entiende "blanca", "azul marino"…)
//   spec=<Etiqueta>~<Valor>  atributos de la ficha técnica (Acabado, Medida, Capacidad…)
//   nuevo=1               dados de alta en los últimos 60 días
//   inStock=1             con existencia
//   onSale=1              en oferta (precio tachado)
//   featured=1            destacados
//   minPrice / maxPrice   rango de precio
//   q                     texto buscado
//   sort                  relevancia | popular | nuevos | priceAsc | priceDesc | nombre
//   page                  página (48 por página)
//
// Lógica: OR dentro de un mismo filtro (Blanco o Negro) y AND entre
// filtros distintos (… y además Porcelana). Los conteos de cada
// grupo se calculan con TODOS los demás filtros aplicados menos el
// propio, igual que en las tiendas grandes: así al marcar "Blanco"
// siguen apareciendo los demás colores con su número.
// ============================================================
import { padresDe, esHijaDe, esPrincipal } from './categoryParents'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Brand from '@/models/Brand'
import Material from '@/models/Material'
import { parseSpecParams } from '@/lib/facets'
import { normalizarColor, regexColor, buscarColor, cssColor } from '@/lib/colores'

export const POR_PAGINA = 48
export const DIAS_NUEVO = 60
const MAX_ETIQUETAS_SPEC = 14
const MAX_VALORES_SPEC = 60
// Etiquetas de ficha técnica que no sirven como filtro.
const SPECS_OCULTAS = /^(sku|c[oó]digo|modelo|ean|upc|garant[ií]a|pa[ií]s|origen|nota|notas)$/i

const lista = (v) =>
  (Array.isArray(v) ? v : v != null && v !== '' ? [v] : [])
    .flatMap((s) => String(s).split(','))
    .map((s) => s.trim())
    .filter(Boolean)

const escapar = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const num = (v) => {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

/** Lee los filtros de searchParams. */
export function leerFiltros(sp = {}) {
  const page = Math.max(1, Math.floor(Number(sp.page) || 1))
  return {
    q: String(sp.q || '').trim(),
    categorias: lista(sp.category),
    marcas: lista(sp.brand),
    materiales: lista(sp.material),
    colores: [...new Set(lista(sp.color).map(normalizarColor))],
    specs: parseSpecParams(sp),
    nuevo: sp.nuevo === '1',
    stock: sp.inStock === '1' || sp.inStock === 'true',
    oferta: sp.onSale === '1' || sp.onSale === 'true',
    destacados: sp.featured === '1',
    min: num(sp.minPrice),
    max: num(sp.maxPrice),
    sort: String(sp.sort || 'relevancia').trim(),
    page,
  }
}

/** Cuántos filtros hay marcados (para el botón "Filtrar (3)"). */
export function contarFiltros(f) {
  return (
    f.categorias.length + f.marcas.length + f.materiales.length + f.colores.length +
    Object.values(f.specs).reduce((n, v) => n + v.length, 0) +
    (f.nuevo ? 1 : 0) + (f.stock ? 1 : 0) + (f.oferta ? 1 : 0) + (f.destacados ? 1 : 0) +
    (f.min != null || f.max != null ? 1 : 0)
  )
}

function ordenar(sort) {
  switch (sort) {
    case 'priceAsc': return { price: 1, _id: 1 }
    case 'priceDesc': return { price: -1, _id: 1 }
    case 'popular': return { salesCount: -1, whatsappClicks: -1, viewsCount: -1, _id: 1 }
    case 'nuevos': return { createdAt: -1, _id: 1 }
    case 'nombre': return { name: 1, _id: 1 }
    default: return { sortOrder: 1, featured: -1, salesCount: -1, createdAt: -1, _id: 1 }
  }
}

const CLAUSULA_STOCK = {
  $or: [
    { 'variants.0': { $exists: false }, $or: [{ stock: null }, { stock: { $gt: 0 } }] },
    { variants: { $elemMatch: { available: { $ne: false }, $or: [{ stock: null }, { stock: { $gt: 0 } }] } } },
  ],
}
const CLAUSULA_OFERTA = { $expr: { $gt: ['$comparePrice', '$price'] } }

/**
 * @param {object} sp            searchParams
 * @param {object} opciones
 *   alcance       ObjectIds de categoría que limitan todo (página de categoría)
 *   hijas         subcategorías a ofrecer en el filtro "Categoría" (página de categoría)
 */
export async function consultarCatalogo(sp, { alcance = null, hijas = null } = {}) {
  const f = leerFiltros(sp)
  const ahora = new Date()

  // ── Catálogos para traducir slugs ⇄ ids ⇄ nombres ──────────
  const [todasCats, todasMarcas, todosMateriales] = await Promise.all([
    Category.find({ active: true }).select('_id name slug parent parents order').sort({ order: 1, name: 1 }).lean(),
    Brand.find({ active: true }).select('_id name slug').sort({ order: 1, name: 1 }).lean(),
    Material.find({ active: true }).select('_id name slug').sort({ order: 1, name: 1 }).lean(),
  ])
  const idsCategoria = (slugs) => {
    const elegidas = todasCats.filter((c) => slugs.includes(c.slug))
    const ids = new Set(elegidas.map((c) => String(c._id)))
    // Una categoría principal incluye a sus subcategorías.
    for (const c of todasCats) if (padresDe(c).some((pid) => ids.has(pid))) ids.add(String(c._id))
    return todasCats.filter((c) => ids.has(String(c._id))).map((c) => c._id)
  }

  // ── Filtro base (siempre) ───────────────────────────────────
  const base = {
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: ahora } }] },
    ],
  }
  if (alcance?.length) base.$and.push({ categories: { $in: alcance } })
  if (f.destacados) base.$and.push({ featured: true })
  if (f.q) {
    const safe = escapar(f.q)
    const marcasQ = todasMarcas.filter((b) => new RegExp(safe, 'i').test(b.name)).map((b) => b._id)
    const o = [
      { name: { $regex: safe, $options: 'i' } },
      { sku: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { line: { $regex: safe, $options: 'i' } },
      { 'variants.value': { $regex: safe, $options: 'i' } },
      { 'variants.sku': { $regex: safe, $options: 'i' } },
    ]
    if (marcasQ.length) o.push({ brand: { $in: marcasQ } })
    base.$and.push({ $or: o })
  }

  // ── Una cláusula por filtro ─────────────────────────────────
  const cl = {}
  if (f.categorias.length) cl.categoria = { categories: { $in: idsCategoria(f.categorias) } }
  if (f.marcas.length) cl.marca = { brand: { $in: todasMarcas.filter((b) => f.marcas.includes(b.slug)).map((b) => b._id) } }
  if (f.materiales.length) cl.material = { materials: { $in: todosMateriales.filter((m) => f.materiales.includes(m.slug)).map((m) => m._id) } }
  if (f.colores.length) {
    const o = []
    for (const c of f.colores) {
      const re = { $regex: regexColor(c), $options: 'i' }
      o.push({ color: re }, { lineColor: re }, { 'variants.value': re })
    }
    cl.color = { $or: o }
  }
  for (const [label, valores] of Object.entries(f.specs)) {
    cl[`spec:${label}`] = { specs: { $elemMatch: { label, value: { $in: valores } } } }
  }
  if (f.nuevo) cl.nuevo = { createdAt: { $gte: new Date(ahora - DIAS_NUEVO * 86400000) } }
  if (f.stock) cl.stock = CLAUSULA_STOCK
  if (f.oferta) cl.oferta = CLAUSULA_OFERTA
  if (f.min != null || f.max != null) {
    cl.precio = { price: { ...(f.min != null ? { $gte: f.min } : {}), ...(f.max != null ? { $lte: f.max } : {}) } }
  }

  /** Todas las cláusulas menos las indicadas. */
  const sin = (...fuera) => {
    const c = Object.entries(cl).filter(([k]) => !fuera.some((x) => (x.endsWith('*') ? k.startsWith(x.slice(0, -1)) : k === x)))
    return c.length ? { $and: c.map(([, v]) => v) } : {}
  }
  const todo = { $and: [base, ...Object.values(cl)] }

  // ── Facetas en una sola consulta ────────────────────────────
  const etiquetasSpecMarcadas = Object.keys(f.specs)
  const conteo = (clausula) => [{ $match: clausula }, { $count: 'n' }]
  const pipeFacetas = {
    categorias: [{ $match: sin('categoria') }, { $unwind: '$categories' }, { $group: { _id: '$categories', n: { $sum: 1 } } }],
    marcas: [{ $match: sin('marca') }, { $match: { brand: { $ne: null } } }, { $group: { _id: '$brand', n: { $sum: 1 } } }],
    materiales: [{ $match: sin('material') }, { $unwind: '$materials' }, { $group: { _id: '$materials', n: { $sum: 1 } } }],
    colores: [
      { $match: sin('color') },
      {
        $project: {
          c: {
            $setUnion: [
              [{ $toLower: { $trim: { input: { $ifNull: ['$color', ''] } } } }, { $toLower: { $trim: { input: { $ifNull: ['$lineColor', ''] } } } }],
              {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ['$variants', []] },
                      as: 'v',
                      cond: { $regexMatch: { input: { $ifNull: ['$$v.label', ''] }, regex: 'colou?r|tono', options: 'i' } },
                    },
                  },
                  as: 'v',
                  in: { $toLower: { $trim: { input: { $ifNull: ['$$v.value', ''] } } } },
                },
              },
            ],
          },
        },
      },
      { $unwind: '$c' },
      { $match: { c: { $ne: '' } } },
      { $group: { _id: '$c', n: { $sum: 1 } } },
    ],
    specs: [
      { $match: sin('spec:*') },
      { $unwind: '$specs' },
      { $group: { _id: { l: '$specs.label', v: '$specs.value' }, n: { $sum: 1 } } },
    ],
    nuevo: conteo({ $and: [sin('nuevo'), { createdAt: { $gte: new Date(ahora - DIAS_NUEVO * 86400000) } }] }),
    stock: conteo({ $and: [sin('stock'), CLAUSULA_STOCK] }),
    oferta: conteo({ $and: [sin('oferta'), CLAUSULA_OFERTA] }),
    precio: [{ $match: sin('precio') }, { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
  }
  // Para cada etiqueta de ficha ya marcada, sus valores se cuentan sin ella.
  etiquetasSpecMarcadas.forEach((label, i) => {
    pipeFacetas[`spec_${i}`] = [
      { $match: sin(`spec:${label}`) },
      { $unwind: '$specs' },
      { $match: { 'specs.label': label } },
      { $group: { _id: '$specs.value', n: { $sum: 1 } } },
    ]
  })

  const [productos, total, [crudo]] = await Promise.all([
    Product.find(todo)
      .populate('categories', 'name slug')
      .populate('brand', 'name slug')
      .populate('materials', 'name slug')
      .sort(ordenar(f.sort))
      .skip((f.page - 1) * POR_PAGINA)
      .limit(POR_PAGINA)
      .lean(),
    Product.countDocuments(todo),
    Product.aggregate([{ $match: base }, { $facet: pipeFacetas }]),
  ])

  // ── Armar facetas legibles ──────────────────────────────────
  const mapa = (arr) => new Map((arr || []).map((r) => [String(r._id), r.n]))
  const nCat = mapa(crudo.categorias)
  const nMarca = mapa(crudo.marcas)
  const nMat = mapa(crudo.materiales)

  // Categorías: en una categoría, sus hijas; en el catálogo, principales + hijas.
  let categorias
  if (hijas) {
    categorias = hijas
      .map((c) => ({ value: c.slug, label: c.name, count: nCat.get(String(c._id)) || 0 }))
      .filter((c) => c.count > 0 || f.categorias.includes(c.value))
  } else {
    const hijasDe = (id) => todasCats.filter((c) => esHijaDe(c, id))
    const cuenta = (c) => {
      // La principal suma lo suyo y lo de sus hijas (sin repetir no es exacto,
      // pero sí orientativo: un producto casi nunca está en dos hijas).
      return (nCat.get(String(c._id)) || 0) + hijasDe(c._id).reduce((s, h) => s + (nCat.get(String(h._id)) || 0), 0)
    }
    categorias = []
    for (const p of todasCats.filter((c) => esPrincipal(c))) {
      const n = cuenta(p)
      if (!n && !f.categorias.includes(p.slug)) continue
      categorias.push({ value: p.slug, label: p.name, count: n, nivel: 0 })
      for (const h of hijasDe(p._id)) {
        const nh = nCat.get(String(h._id)) || 0
        if (nh || f.categorias.includes(h.slug)) categorias.push({ value: h.slug, label: h.name, count: nh, nivel: 1 })
      }
    }
  }

  const marcas = todasMarcas
    .map((b) => ({ value: b.slug, label: b.name, count: nMarca.get(String(b._id)) || 0 }))
    .filter((b) => b.count > 0 || f.marcas.includes(b.value))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))

  const materiales = todosMateriales
    .map((m) => ({ value: m.slug, label: m.name, count: nMat.get(String(m._id)) || 0 }))
    .filter((m) => m.count > 0 || f.materiales.includes(m.value))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))

  // Colores: se juntan las formas de escribir el mismo color.
  const porColor = new Map()
  for (const r of crudo.colores || []) {
    const nombre = normalizarColor(r._id)
    if (!nombre) continue
    porColor.set(nombre, (porColor.get(nombre) || 0) + r.n)
  }
  for (const c of f.colores) if (!porColor.has(c)) porColor.set(c, 0)
  const colores = [...porColor.entries()]
    .map(([nombre, n]) => ({ value: nombre, label: nombre, count: n, css: cssColor(nombre), conocido: Boolean(buscarColor(nombre)) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'es'))

  // Ficha técnica: cada etiqueta con al menos 2 valores.
  const porEtiqueta = new Map()
  for (const r of crudo.specs || []) {
    const { l, v } = r._id || {}
    if (!l || !v || SPECS_OCULTAS.test(l) || etiquetasSpecMarcadas.includes(l)) continue
    if (!porEtiqueta.has(l)) porEtiqueta.set(l, [])
    porEtiqueta.get(l).push({ value: v, label: v, count: r.n })
  }
  etiquetasSpecMarcadas.forEach((label, i) => {
    const vals = (crudo[`spec_${i}`] || []).map((r) => ({ value: r._id, label: r._id, count: r.n }))
    for (const v of f.specs[label]) if (!vals.some((x) => x.value === v)) vals.push({ value: v, label: v, count: 0 })
    porEtiqueta.set(label, vals)
  })
  const specs = [...porEtiqueta.entries()]
    .filter(([label, vals]) => vals.length >= 2 || etiquetasSpecMarcadas.includes(label))
    .map(([label, vals]) => ({
      label,
      total: vals.reduce((s, v) => s + v.count, 0),
      values: vals
        .sort((a, b) => b.count - a.count || String(a.label).localeCompare(String(b.label), 'es', { numeric: true }))
        .slice(0, MAX_VALORES_SPEC),
    }))
    .sort((a, b) => (etiquetasSpecMarcadas.includes(b.label) ? 1 : 0) - (etiquetasSpecMarcadas.includes(a.label) ? 1 : 0) || b.total - a.total)
    .slice(0, MAX_ETIQUETAS_SPEC)

  const precio = crudo.precio?.[0] || { min: 0, max: 0 }

  const facetas = {
    categorias,
    marcas,
    materiales,
    colores,
    specs,
    nuevo: crudo.nuevo?.[0]?.n || 0,
    stock: crudo.stock?.[0]?.n || 0,
    oferta: crudo.oferta?.[0]?.n || 0,
    precio: { min: Math.floor(precio.min || 0), max: Math.ceil(precio.max || 0) },
  }

  return JSON.parse(JSON.stringify({
    productos,
    total,
    pagina: f.page,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    facetas,
    filtros: f,
    marcados: contarFiltros(f),
  }))
}
