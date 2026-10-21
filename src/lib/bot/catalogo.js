// ============================================================
// Lo que el bot puede consultar del catálogo REAL de la tienda.
// Precios, mayoreo, existencias, colores y link salen de la base de
// datos (siempre al día). Lo que venga de los PDF de catálogos
// (catalogos-pdf.json) solo aporta descripción: medidas, material,
// usos. Nunca precios.
// ============================================================
import Product from '@/models/Product'
import { publicProductFilter } from '@/lib/public-products'
import { priceTiers, saleStep, toStock } from '@/lib/pricing'
import catalogosPdf from './catalogos-pdf.json'

const SITIO = () => String(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cristasur.com').replace(/\/+$/, '')

// "sarten" encuentra "SARTÉN" y al revés.
const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
function regexPalabra(p) {
  const mapa = { a: '[aáà]', e: '[eéè]', i: '[iíì]', o: '[oóò]', u: '[uúüù]', n: '[nñ]' }
  const seguro = sinAcentos(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(seguro.replace(/[aeioun]/g, (c) => mapa[c]), 'i')
}

// Palabras que no ayudan a buscar.
const VACIAS = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'con', 'un', 'una', 'unos', 'unas', 'y', 'o', 'en', 'que', 'me', 'quiero', 'busco', 'tienen', 'hay', 'cm', 'pzas', 'piezas'])

function enPdf(nombre, sku) {
  const n = sinAcentos(nombre)
  return catalogosPdf.find((x) => (sku && x.sku && String(x.sku) === String(sku)) || (x.nombre && n.includes(sinAcentos(x.nombre))))
}

function resumen(p) {
  const tiers = priceTiers(p)
  const variantes = (p.variants || []).map((v) => ({
    [v.label || 'Variante']: v.value,
    disponible: v.available !== false && toStock(v.stock) !== 0,
  }))
  const stock = toStock(p.stock)
  const extra = enPdf(p.name, p.sku)
  return {
    id: String(p._id),
    nombre: p.name,
    linea: p.lineLabel || undefined,
    precios: tiers.map((t) => (t.minQty > 1 ? `$${t.price} c/u desde ${t.minQty} pzas` : `$${t.price} c/u`)),
    se_vende_de: saleStep(p) > 1 ? `${saleStep(p)} en ${saleStep(p)}` : 'pieza',
    variantes: variantes.length ? variantes : undefined,
    disponible: variantes.length ? variantes.some((v) => v.disponible) : stock !== 0,
    capacidad: p.capacity ? `${p.capacity} ${p.capacityUnit || ''}`.trim() : undefined,
    descripcion: String(p.description || '').slice(0, 300) || undefined,
    ficha: extra?.descripcion || undefined,
    link: `${SITIO()}/productos/${p._id}`,
    foto: p.image || undefined,
  }
}

/** Busca productos publicados por palabras (todas deben aparecer). */
export async function buscarProductos({ texto = '', maximo = 6 } = {}) {
  const palabras = sinAcentos(texto).split(/[^a-z0-9.]+/).filter((w) => w.length > 1 && !VACIAS.has(w)).slice(0, 6)
  if (!palabras.length) return []
  const campo = (re) => ({ $or: [{ name: re }, { lineLabel: re }, { sku: re }, { 'variants.value': re }, { tags: re }] })
  const sel = 'name sku price wholesalePrice wholesaleMinQty hundredPrice hundredMinQty qtyStep stock variants lineLabel capacity capacityUnit description image'
  const base = publicProductFilter()

  // Primero todas las palabras; si no sale nada, cualquiera de ellas.
  let docs = await Product.find({ ...base, $and: [...base.$and, ...palabras.map((w) => campo(regexPalabra(w)))] })
    .select(sel).sort({ salesCount: -1, featured: -1 }).limit(maximo).lean()
  if (!docs.length && palabras.length > 1) {
    docs = await Product.find({ ...base, $and: [...base.$and, { $or: palabras.map((w) => campo(regexPalabra(w))) }] })
      .select(sel).sort({ salesCount: -1, featured: -1 }).limit(maximo).lean()
  }
  return docs.map(resumen)
}

export async function productoPorId(id) {
  const p = await Product.findOne({ ...publicProductFilter(), _id: id }).lean()
  return p ? resumen(p) : null
}
