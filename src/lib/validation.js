// ============================================================
// src/lib/validation.js
// Validación y sanitización de inputs.
// ============================================================
import validator from 'validator'

const MAX_GALLERY = 10
const MAX_VARIANTS = 20

export function cleanString(str, { max = 500 } = {}) {
  if (typeof str !== 'string') return ''
  const t = str.trim().slice(0, max)
  return validator.escape(t)
}

export function cleanSoft(str, { max = 2000 } = {}) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, max)
}

export function isValidEmail(email) {
  return typeof email === 'string' && validator.isEmail(email)
}

function sanitizeVariants(input) {
  if (!Array.isArray(input)) return []
  return input
    .slice(0, MAX_VARIANTS)
    .map((v) => {
      // Modelo simétrico: cada variante declara su dimensión (label) y su
      // valor (value). Ambos obligatorios — sin ellos la variante no es vendible.
      const label = cleanSoft(v?.label, { max: 60 })
      const value = cleanSoft(v?.value, { max: 60 })
      if (!label || !value) return null

      // Helper: '' / null / undefined → null; si no, número.
      const num = (x) => (x === '' || x == null ? null : Number(x))
      const okNum = (n, min = 0) => (Number.isFinite(n) && n >= min ? n : null)

      const priceN    = num(v?.price)
      const cmpN      = num(v?.comparePrice)
      const stockN    = num(v?.stock)
      const wsPriceN  = num(v?.wholesalePrice)
      const wsMinQtyN = num(v?.wholesaleMinQty)
      // El form manda bulkPrice/bulkMinQty; la BD los guarda como hundredPrice.
      const hPriceN   = num(v?.hundredPrice ?? v?.bulkPrice)
      const hMinQtyN  = num(v?.hundredMinQty ?? v?.bulkMinQty)

      // Logística (requerida para cotizar envíos automáticamente)
      const weightN    = num(v?.weight)
      const pkgWeightN = num(v?.pkgWeight)
      const pkgLenN    = num(v?.pkgLength)
      const pkgWidN    = num(v?.pkgWidth)
      const pkgHeiN    = num(v?.pkgHeight)

      return {
        label,
        value,
        sku: v?.sku ? cleanString(v.sku, { max: 40 }) : undefined,
        barcode: cleanSoft(v?.barcode, { max: 40 }),
        price:           okNum(priceN),
        comparePrice:    okNum(cmpN),
        wholesalePrice:  okNum(wsPriceN),
        wholesaleMinQty: okNum(wsMinQtyN, 2),
        hundredPrice:    okNum(hPriceN),
        hundredMinQty:   okNum(hMinQtyN, 2),
        // available: por defecto true; sólo false si viene explícitamente en false.
        available: v?.available === false ? false : true,
        stock: okNum(stockN),
        weight:    okNum(weightN),
        pkgWeight: okNum(pkgWeightN),
        pkgLength: okNum(pkgLenN),
        pkgWidth:  okNum(pkgWidN),
        pkgHeight: okNum(pkgHeiN),
        image: cleanSoft(v?.image, { max: 500 }),
        images: Array.isArray(v?.images)
          ? v.images.map((u) => cleanSoft(u, { max: 500 })).filter(Boolean).slice(0, 10)
          : [],
      }
    })
    .filter(Boolean)
}

export function validateProductPayload(body) {
  const errors = []
  const name = cleanSoft(body?.name, { max: 120 })
  const description = cleanSoft(body?.description, { max: 800 })
  const price = Number(body?.price)
  const comparePrice =
    body?.comparePrice !== undefined && body?.comparePrice !== null && body?.comparePrice !== ''
      ? Number(body.comparePrice)
      : null
  // Precio mayoreo (opcional). Si está definido, requiere también minQty >= 2.
  const hasWholesale =
    body?.wholesalePrice !== undefined && body?.wholesalePrice !== null && body?.wholesalePrice !== ''
  const wholesalePrice = hasWholesale ? Number(body.wholesalePrice) : null
  const hasMinQty =
    body?.wholesaleMinQty !== undefined && body?.wholesaleMinQty !== null && body?.wholesaleMinQty !== ''
  const wholesaleMinQty = hasMinQty ? Math.floor(Number(body.wholesaleMinQty)) : null
  // Tercer precio (precio por ciento). Soportamos también el alias
  // 'hundredPrice/hundredMinQty' que ya usa el ProductForm.
  const rawBulkPrice = body?.bulkPrice ?? body?.hundredPrice
  const rawBulkMin   = body?.bulkMinQty ?? body?.hundredMinQty
  const hasBulk = rawBulkPrice !== undefined && rawBulkPrice !== null && rawBulkPrice !== ''
  const bulkPrice = hasBulk ? Number(rawBulkPrice) : null
  const hasBulkMin = rawBulkMin !== undefined && rawBulkMin !== null && rawBulkMin !== ''
  const bulkMinQty = hasBulkMin ? Math.floor(Number(rawBulkMin)) : null
  const categories = Array.isArray(body?.categories)
    ? body.categories
        .map((c) => (typeof c === 'string' ? c.trim() : ''))
        .filter((c) => c && validator.isMongoId(c))
    : []
  const image = cleanSoft(body?.image, { max: 500 })
  const galleryRaw = Array.isArray(body?.gallery) ? body.gallery : []
  const gallery = Array.from(
    new Set(
      galleryRaw
        .map((u) => cleanSoft(u, { max: 500 }))
        .filter((u) => u && u !== image)
    )
  ).slice(0, MAX_GALLERY)
  const variants = sanitizeVariants(body?.variants)

  const featured = Boolean(body?.featured)
  const active = body?.active === undefined ? true : Boolean(body.active)
  // null = ilimitado (campo vacío). 0 = sin stock. >0 = cantidad exacta.
  const stock =
    body?.stock === undefined || body?.stock === null || body?.stock === ''
      ? null
      : Number(body.stock)
  const sku = body?.sku ? cleanString(body.sku, { max: 40 }) : undefined

  // Marca (ObjectId string) — opcional
  const brand =
    body?.brand && validator.isMongoId(String(body.brand)) ? String(body.brand) : null

  // Materiales (array de ObjectId) — opcional, puede ser varios
  const materials = Array.isArray(body?.materials)
    ? body.materials.map(String).filter((m) => validator.isMongoId(m))
    : []

  // Resistencia — baja / media / alta
  const resistencia = ['baja', 'media', 'alta'].includes(body?.resistencia) ? body.resistencia : ''

  // Color libre (ej: "Rojo", "Azul marino") — opcional
  const color = cleanSoft(body?.color, { max: 60 })

  // Múltiplo de venta (de N en N). null o 1 = de uno en uno.
  const qtyStepRaw = body?.qtyStep
  const qtyStep =
    qtyStepRaw === undefined || qtyStepRaw === null || qtyStepRaw === ''
      ? null
      : Math.max(1, Math.floor(Number(qtyStepRaw)))
  if (qtyStep !== null && !Number.isFinite(qtyStep))
    errors.push('El múltiplo de venta debe ser un número entero positivo')

  // ---- Capacidad (opcional, visible al cliente) ----
  const CAPACITY_UNITS = ['L', 'mL', 'oz', 'fl oz', 'gal', 'cl', 'cc']
  const capacityRaw = body?.capacity
  const capacity =
    capacityRaw === undefined || capacityRaw === null || capacityRaw === ''
      ? null
      : parseFloat(capacityRaw)
  const capacityUnit = CAPACITY_UNITS.includes(body?.capacityUnit)
    ? body.capacityUnit
    : ''
  if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0))
    errors.push('La capacidad debe ser un número positivo')

  // ---- Dimensiones del producto (visibles al cliente) ----
  // Todos opcionales (null = no definido). Unidades: kg y cm.
  function parseDim(val) {
    if (val === undefined || val === null || val === '') return null
    const n = parseFloat(val)
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 1000) / 1000 : null
  }
  const weight = parseDim(body?.weight) // kg
  const length = parseDim(body?.length) // cm
  const width  = parseDim(body?.width)  // cm
  const height = parseDim(body?.height) // cm

  // Validaciones de dimensiones del producto
  if (weight !== null && weight > 999)
    errors.push('El peso no puede superar 999 kg')
  if (length !== null && length > 999)
    errors.push('El largo no puede superar 999 cm')
  if (width !== null && width > 999)
    errors.push('El ancho no puede superar 999 cm')
  if (height !== null && height > 999)
    errors.push('El alto no puede superar 999 cm')

  // ---- Caja para envío / logística (uso interno, no se muestra al cliente) ----
  const pkgWeight = parseDim(body?.pkgWeight)
  const pkgLength = parseDim(body?.pkgLength)
  const pkgWidth  = parseDim(body?.pkgWidth)
  const pkgHeight = parseDim(body?.pkgHeight)
  const pkgNote   = cleanSoft(body?.pkgNote, { max: 120 })

  if (pkgWeight !== null && pkgWeight > 999)
    errors.push('El peso de la caja no puede superar 999 kg')
  if (pkgLength !== null && pkgLength > 999)
    errors.push('El largo de la caja no puede superar 999 cm')
  if (pkgWidth !== null && pkgWidth > 999)
    errors.push('El ancho de la caja no puede superar 999 cm')
  if (pkgHeight !== null && pkgHeight > 999)
    errors.push('El alto de la caja no puede superar 999 cm')

  // Estado: respetar el valor del body; default published.
  // Esto permite importar borradores (status: 'draft') sin sobreescribir.
  const status = body?.status === 'draft' ? 'draft' : 'published'
  const publishAt =
    body?.publishAt && !isNaN(new Date(body.publishAt).getTime())
      ? new Date(body.publishAt)
      : null

  // Tags libres. Lowercase, sin acentos, sin espacios → guiones. Máx 12 tags.
  const rawTags = Array.isArray(body?.tags)
    ? body.tags
    : typeof body?.tags === 'string'
      ? body.tags.split(',')
      : []
  const tags = Array.from(
    new Set(
      rawTags
        .map((t) =>
          String(t || '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .slice(0, 30)
        )
        .filter(Boolean)
    )
  ).slice(0, 12)

  if (!name || name.length < 2) errors.push('El nombre es obligatorio (mín. 2 caracteres)')
  // Descripción obligatoria solo al publicar; los borradores pueden quedar sin ella.
  if (status === 'published' && (!description || description.length < 5))
    errors.push('La descripción es obligatoria (mín. 5 caracteres)')
  if (!Number.isFinite(price) || price < 0)
    errors.push('El precio debe ser un número positivo')
  if (comparePrice !== null && (!Number.isFinite(comparePrice) || comparePrice < 0))
    errors.push('El precio comparativo debe ser un número positivo')
  // Si wholesalePrice >= price (caso común en listas de proveedor donde el
  // mismo precio aparece en Mayoreo 1 y Mayoreo 2), simplemente lo ignoramos
  // en lugar de fallar. Eso protege el flujo de importación masiva.
  let _wholesalePrice = wholesalePrice
  let _wholesaleMinQty = wholesaleMinQty
  if (_wholesalePrice !== null && Number.isFinite(price) && _wholesalePrice >= price) {
    _wholesalePrice = null
    _wholesaleMinQty = null
  }
  if (_wholesalePrice !== null) {
    if (!Number.isFinite(_wholesalePrice) || _wholesalePrice < 0)
      errors.push('El precio de mayoreo debe ser un número positivo')
    if (!Number.isFinite(_wholesaleMinQty) || _wholesaleMinQty < 2)
      errors.push('La cantidad mínima de mayoreo debe ser 2 o más')
  }
  // Mismo criterio para bulk: si es >= price, lo ignoramos.
  let _bulkPrice = bulkPrice
  let _bulkMinQty = bulkMinQty
  if (_bulkPrice !== null && Number.isFinite(price) && _bulkPrice >= price) {
    _bulkPrice = null
    _bulkMinQty = null
  }
  if (_bulkPrice !== null) {
    if (!Number.isFinite(_bulkPrice) || _bulkPrice < 0)
      errors.push('El precio por ciento debe ser un número positivo')
    if (!Number.isFinite(_bulkMinQty) || _bulkMinQty < 2)
      errors.push('La cantidad mínima para precio por ciento debe ser 2 o más')
  }
  // Categoría obligatoria solo al publicar; los borradores pueden quedar sin ella.
  if (status === 'published' && !categories.length)
    errors.push('Debe seleccionar al menos una categoría válida')
  if (stock !== null && (!Number.isFinite(stock) || stock < 0))
    errors.push('El stock debe ser un número positivo o dejarse vacío (ilimitado)')

  return {
    errors,
    value: {
      name,
      description,
      price,
      comparePrice,
      wholesalePrice: _wholesalePrice,
      wholesaleMinQty: _wholesaleMinQty,
      hundredPrice: _bulkPrice,
      hundredMinQty: _bulkMinQty,
      categories,
      image,
      gallery,
      variants,
      featured,
      active,
      stock,
      sku,
      status,
      publishAt,
      tags,
      brand,
      materials,
      resistencia,
      color,
      qtyStep,
      weight,
      length,
      width,
      height,
      capacity,
      capacityUnit,
      pkgWeight,
      pkgLength,
      pkgWidth,
      pkgHeight,
      pkgNote,
    },
  }
}

export function validateCategoryPayload(body) {
  const errors = []
  const name = cleanSoft(body?.name, { max: 60 })
  const description = cleanSoft(body?.description, { max: 300 })
  const seoTitle = cleanSoft(body?.seoTitle, { max: 80 })
  const seoDescription = cleanSoft(body?.seoDescription, { max: 200 })
  const seoText = cleanSoft(body?.seoText, { max: 8000 })
  const icon = cleanSoft(body?.icon, { max: 10 })
  const image = cleanSoft(body?.image, { max: 500 })
  const order = Number.isFinite(Number(body?.order)) ? Number(body.order) : 0
  const active = body?.active === undefined ? true : Boolean(body.active)
  const featured = Boolean(body?.featured)
  // parent: '' o null = categoría principal. Si viene, debe ser un ObjectId.
  const rawParent = typeof body?.parent === 'string' ? body.parent.trim() : ''
  const parent = rawParent && /^[a-f\d]{24}$/i.test(rawParent) ? rawParent : null

  if (!name || name.length < 2)
    errors.push('El nombre de la categoría es obligatorio (mín. 2 caracteres)')
  if (rawParent && !parent)
    errors.push('La categoría padre no es válida')
  if (description && description.length > 300)
    errors.push('La descripción de la categoría es demasiado larga')

  return {
    errors,
    value: {
      name,
      description,
      seoTitle,
      seoDescription,
      seoText,
      icon,
      image,
      order,
      active,
      featured,
      parent,
    },
  }
}

export function validateReviewPayload(body) {
  const errors = []
  const name = cleanSoft(body?.name, { max: 60 })
  const email = cleanSoft(body?.email, { max: 120 }).toLowerCase()
  const rating = Math.round(Number(body?.rating))
  const comment = cleanSoft(body?.comment, { max: 600 })
  const product = typeof body?.product === 'string' ? body.product.trim() : ''

  if (!name || name.length < 2) errors.push('Indica tu nombre')
  if (email && !validator.isEmail(email)) errors.push('Email inválido')
  if (!Number.isFinite(rating) || rating < 1 || rating > 5)
    errors.push('La calificación debe ser de 1 a 5')
  if (!validator.isMongoId(product)) errors.push('Producto inválido')

  return {
    errors,
    value: { name, email: email || undefined, rating, comment, product },
  }
}

export function validateCouponPayload(body) {
  const errors = []
  const code = cleanString(body?.code, { max: 30 }).toUpperCase()
  const description = cleanSoft(body?.description, { max: 200 })
  const type = ['percent', 'fixed'].includes(body?.type) ? body.type : null
  const value = Number(body?.value)
  const minSubtotal = body?.minSubtotal ? Number(body.minSubtotal) : 0
  const usageLimit = body?.usageLimit ? Number(body.usageLimit) : 0
  const active = body?.active === undefined ? true : Boolean(body.active)
  const startsAt = body?.startsAt ? new Date(body.startsAt) : null
  const endsAt = body?.endsAt ? new Date(body.endsAt) : null
  const categories = Array.isArray(body?.categories)
    ? body.categories.filter((c) => validator.isMongoId(c))
    : []
  const products = Array.isArray(body?.products)
    ? body.products.filter((p) => validator.isMongoId(p))
    : []

  if (!/^[A-Z0-9_-]{3,30}$/.test(code))
    errors.push('El código debe tener 3-30 chars (letras, números, - y _)')
  if (!type) errors.push('Tipo debe ser percent o fixed')
  if (!Number.isFinite(value) || value < 0)
    errors.push('El valor del descuento debe ser positivo')
  if (type === 'percent' && value > 100)
    errors.push('El porcentaje no puede exceder 100')
  if (startsAt && endsAt && startsAt > endsAt)
    errors.push('La fecha de inicio debe ser anterior a la de fin')

  return {
    errors,
    value: {
      code,
      description,
      type,
      value,
      minSubtotal,
      usageLimit,
      active,
      startsAt: startsAt && !isNaN(startsAt) ? startsAt : null,
      endsAt: endsAt && !isNaN(endsAt) ? endsAt : null,
      categories,
      products,
    },
  }
}

// Resume los cambios en texto (fallback para entradas antiguas).
export function diffSummary(before, after, fields) {
  const parts = []
  for (const f of fields) {
    const a = before?.[f]
    const b = after?.[f]
    const sa = typeof a === 'object' ? JSON.stringify(a) : String(a ?? '')
    const sb = typeof b === 'object' ? JSON.stringify(b) : String(b ?? '')
    if (sa !== sb) {
      const fmtA = sa.length > 60 ? sa.slice(0, 57) + '…' : sa
      const fmtB = sb.length > 60 ? sb.slice(0, 57) + '…' : sb
      parts.push(`${f}: ${fmtA || '∅'} → ${fmtB || '∅'}`)
    }
  }
  return parts.join(' | ')
}

// Diff estructurado [{field, from, to}] con valores completos sin truncar.
// Se guarda en editHistory.diff para mostrar detalle total en el historial.
export function diffFields(before, after, fields) {
  const LABELS = {
    name: 'Nombre', description: 'Descripción', price: 'Precio',
    comparePrice: 'Precio tachado', wholesalePrice: 'Precio mayoreo',
    wholesaleMinQty: 'Mínimo mayoreo', hundredPrice: 'Precio por ciento',
    hundredMinQty: 'Mínimo precio por ciento', stock: 'Stock', featured: 'Destacado',
    active: 'Activo', sku: 'SKU', image: 'Imagen', gallery: 'Galería',
    variants: 'Variantes', categories: 'Categorías', brand: 'Marca',
    color: 'Color', weight: 'Peso producto (kg)', length: 'Largo producto (cm)',
    width: 'Ancho producto (cm)', height: 'Alto producto (cm)',
    pkgWeight: 'Peso caja (kg)', pkgLength: 'Largo caja (cm)',
    pkgWidth: 'Ancho caja (cm)', pkgHeight: 'Alto caja (cm)',
    pkgNote: 'Nota caja envío', status: 'Estado',
    publishAt: 'Publicar el', qtyStep: 'Paso de cantidad',
    materials: 'Materiales', tags: 'Etiquetas',
  }
  const result = []
  for (const f of fields) {
    const a = before?.[f]
    const b = after?.[f]
    const sa = typeof a === 'object' ? JSON.stringify(a) : String(a ?? '')
    const sb = typeof b === 'object' ? JSON.stringify(b) : String(b ?? '')
    if (sa !== sb) {
      result.push({ field: LABELS[f] || f, from: sa || '∅', to: sb || '∅' })
    }
  }
  return result
}
