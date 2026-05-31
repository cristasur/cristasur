// ============================================================
// src/lib/csv.js
// Utilidades para generar y parsear CSV sin dependencias.
// (Usamos este parser robusto en el servidor; el cliente puede
//  usar papaparse si quieres reportes más sofisticados.)
// ============================================================

// Convierte un array de objetos a CSV con headers en el primer row.
// Respeta comillas, comas y saltos de línea según RFC 4180.
export function toCSV(rows, columns) {
  const header = columns.map(escapeCell).join(',')
  const body = rows
    .map((r) => columns.map((c) => escapeCell(valueOf(r, c))).join(','))
    .join('\n')
  return '\uFEFF' + header + '\n' + body + '\n' // BOM para que Excel abra UTF-8 correcto
}

function valueOf(obj, key) {
  const v = obj?.[key]
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'object' ? x?.name || x?._id || JSON.stringify(x) : x)).join('|')
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function escapeCell(val) {
  const s = val == null ? '' : String(val)
  if (/["\n,]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

// Parser de CSV RFC 4180. Acepta "," o ";" como separador.
// Devuelve array de objetos usando la primera fila como headers.
export function fromCSV(text) {
  // Quitamos BOM
  const src = text.replace(/^\uFEFF/, '')
  if (!src.trim()) return []
  const delim = detectDelimiter(src)
  const rows = parseRows(src, delim)
  if (!rows.length) return []
  const [headerRow, ...dataRows] = rows
  const headers = headerRow.map((h) => h.trim())
  return dataRows
    .filter((r) => r.some((c) => c !== '' && c != null))
    .map((r) => {
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = r[i] ?? ''
      })
      return obj
    })
}

function detectDelimiter(text) {
  // Muestreamos la primera línea
  const first = text.split(/\r?\n/, 1)[0] || ''
  const commas = (first.match(/,/g) || []).length
  const semis = (first.match(/;/g) || []).length
  return semis > commas ? ';' : ','
}

function parseRows(text, delim) {
  const rows = []
  let field = ''
  let row = []
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === delim) {
        row.push(field)
        field = ''
      } else if (ch === '\r') {
        // ignoramos; \n cerrará la fila
      } else if (ch === '\n') {
        row.push(field)
        rows.push(row)
        row = []
        field = ''
      } else {
        field += ch
      }
    }
  }
  // última fila
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// Normaliza una fila CSV importada al formato del modelo Product.
// Acepta nombres de columna flexibles (case-insensitive, con o sin acentos).
// Devuelve también el _id (si la fila lo trae) para poder hacer upsert
// en la ruta de import sin duplicar productos ya existentes.
export function rowToProduct(row, categoryIdByName) {
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find(
        (h) => normalize(h) === normalize(k)
      )
      if (found && row[found] !== '') return row[found]
    }
    return ''
  }

  const rawId = String(get('_id', 'id') || '').trim()
  const name = String(get('name', 'nombre', 'producto')).trim()
  const description = String(get('description', 'descripcion', 'descripción')).trim()
  const price = Number(get('price', 'precio') || 0)
  const comparePrice = Number(get('comparePrice', 'precioAnterior', 'precio_anterior') || 0) || null
  // Precio mayoreo opcional. Si vienen ambas columnas, se aplican.
  const wholesaleRaw = String(
    get('wholesalePrice', 'precioMayoreo', 'precio_mayoreo', 'mayoreo') || ''
  ).trim()
  const wholesalePrice = wholesaleRaw === '' ? null : Number(wholesaleRaw) || null
  const minQtyRaw = String(
    get(
      'wholesaleMinQty',
      'cantidadMayoreo',
      'cantidad_mayoreo',
      'minMayoreo',
      'min_mayoreo'
    ) || ''
  ).trim()
  const wholesaleMinQty =
    minQtyRaw === '' ? null : Math.floor(Number(minQtyRaw)) || null
  // Tercer precio "por ciento" (mayoreo 3)
  const bulkRaw = String(
    get('bulkPrice', 'precioPorCiento', 'precio_por_ciento', 'porCiento', 'mayoreo3', 'mayoreo_3') || ''
  ).trim()
  const bulkPrice = bulkRaw === '' ? null : Number(bulkRaw) || null
  const bulkMinRaw = String(
    get('bulkMinQty', 'cantidadPorCiento', 'cantidad_por_ciento', 'minPorCiento', 'min_por_ciento') || ''
  ).trim()
  const bulkMinQty = bulkMinRaw === '' ? null : Math.floor(Number(bulkMinRaw)) || null
  const stock = Number(get('stock', 'inventario') || 0)
  const sku = String(get('sku') || '').trim().toUpperCase() || undefined
  const featured = truthy(get('featured', 'destacado'))
  const active = get('active', 'publicado', 'activo') === '' ? true : truthy(get('active', 'publicado', 'activo'))
  // Estado: leer del CSV; si no viene o no es reconocido, published.
  const rawStatus = String(get('status', 'estado') || '').trim().toLowerCase()
  const status = rawStatus === 'draft' ? 'draft' : 'published'
  const image = String(get('image', 'imagen') || '').trim()
  const galleryStr = String(get('gallery', 'galeria', 'galería') || '').trim()
  const gallery = galleryStr ? galleryStr.split('|').map((s) => s.trim()).filter(Boolean) : []

  const categoriesStr = String(get('categories', 'categorias', 'categorías', 'category', 'categoria') || '')
    .trim()
  const catNames = categoriesStr
    ? categoriesStr.split('|').map((s) => s.trim()).filter(Boolean)
    : []
  const categories = catNames
    .map((n) => categoryIdByName[normalize(n)])
    .filter(Boolean)

  // Valida formato básico de ObjectId (24 hex). Si no lo cumple, ignoramos.
  const _id = /^[a-f0-9]{24}$/i.test(rawId) ? rawId : ''

  return {
    ok: Boolean(name && price >= 0 && description && categories.length),
    missing: [
      !name && 'name',
      !description && 'description',
      !(price >= 0) && 'price',
      !categories.length && 'categories',
    ].filter(Boolean),
    data: {
      _id,
      name,
      description,
      price,
      comparePrice,
      wholesalePrice,
      wholesaleMinQty,
      bulkPrice,
      bulkMinQty,
      stock,
      sku,
      featured,
      active,
      image,
      gallery,
      categories,
      status,
    },
    rawCategoryNames: catNames,
  }
}

function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function truthy(v) {
  const s = String(v).toLowerCase().trim()
  return s === 'true' || s === '1' || s === 'si' || s === 'sí' || s === 'yes'
}

// Columnas estándar del export de productos
export const PRODUCT_EXPORT_COLUMNS = [
  '_id',
  'name',
  'description',
  'price',
  'comparePrice',
  'wholesalePrice',
  'wholesaleMinQty',
  'bulkPrice',
  'bulkMinQty',
  'status',
  'stock',
  'sku',
  'featured',
  'active',
  'image',
  'gallery',
  'categories',
  'createdAt',
  'updatedAt',
]
