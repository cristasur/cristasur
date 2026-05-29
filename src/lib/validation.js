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
      // ¿Variante multi-dimensional? (tiene optionValues con al menos una clave)
      const rawOV = v?.optionValues
      const hasOV =
        rawOV &&
        typeof rawOV === 'object' &&
        !Array.isArray(rawOV) &&
        Object.keys(rawOV).length > 0

      // Sanitizar optionValues → objeto limpio { clave: valor }
      const optionValues = hasOV
        ? Object.fromEntries(
            Object.entries(rawOV)
              .map(([k, val]) => [
                cleanSoft(String(k), { max: 40 }),
                cleanSoft(String(val), { max: 60 }),
              ])
              .filter(([k, val]) => k && val)
          )
        : undefined

      // label y value: se derivan de optionValues o se usan directamente
      let label, value
      if (optionValues && Object.keys(optionValues).length > 0) {
        const entries = Object.entries(optionValues)
        label = entries[0][0]                             // primera clave como label
        value = entries.map(([, val]) => val).join(' / ') // valores concatenados
      } else {
        label = cleanSoft(v?.label, { max: 60 })
        value = cleanSoft(v?.value, { max: 60 })
        if (!label || !value) return null
      }

      const priceN = v?.price === '' || v?.price == null ? null : Number(v.price)
      const cmpN   = v?.comparePrice === '' || v?.comparePrice == null ? null : Number(v.comparePrice)
      // null/undefined/'' = ilimitado (Disponible), 0 = sin stock, >0 = cantidad exacta
      const stockRaw = v?.stock
      const stockN = (stockRaw === null || stockRaw === undefined || stockRaw === '')
        ? null
        : Number(stockRaw)
      // Precios de mayoreo y por-ciento opcionales (null = hereda del padre)
      const wsPriceN  = v?.wholesalePrice === '' || v?.wholesalePrice == null ? null : Number(v.wholesalePrice)
      const wsMinQtyN = v?.wholesaleMinQty === '' || v?.wholesaleMinQty == null ? null : Number(v.wholesaleMinQty)
      const hPriceN   = v?.hundredPrice === '' || v?.hundredPrice == null ? null : Number(v.hundredPrice)
      const hMinQtyN  = v?.hundredMinQty === '' || v?.hundredMinQty == null ? null : Number(v.hundredMinQty)

      return {
        label,
        value,
        ...(optionValues ? { optionValues } : {}),
        sku: v?.sku ? cleanString(v.sku, { max: 40 }) : undefined,
        price: Number.isFinite(priceN) && priceN >= 0 ? priceN : null,
        comparePrice: Number.isFinite(cmpN) && cmpN >= 0 ? cmpN : null,
        wholesalePrice:  Number.isFinite(wsPriceN)  && wsPriceN  >= 0 ? wsPriceN  : null,
        wholesaleMinQty: Number.isFinite(wsMinQtyN) && wsMinQtyN >= 2 ? wsMinQtyN : null,
        hundredPrice:    Number.isFinite(hPriceN)   && hPriceN   >= 0 ? hPriceN   : null,
        hundredMinQty:   Number.isFinite(hMinQtyN)  && hMinQtyN  >= 2 ? hMinQtyN  : null,
        stock: stockN === null ? null : (Number.isFinite(stockN) && stockN >= 0 ? stockN : null),
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
  // Tercer precio (precio por ciento). Sin lógica activa aún — solo se almacena.
  const hasHundred =
    body?.hundredPrice !== undefined && body?.hundredPrice !== null && body?.hundredPrice !== ''
  const hundredPrice = hasHundred ? Number(body.hundredPrice) : null
  const hasHundredMin =
    body?.hundredMinQty !== undefined && body?.hundredMinQty !== null && body?.hundredMinQty !== ''
  const hundredMinQty = hasHundredMin ? Math.floor(Number(body.hundredMinQty)) : null
  const categories = Array.isArray(body?.categories)
    ? body.categories.map((c) => (typeof c === 'string' ? c.trim() : '')).filter(Boolean)
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

  // Grupos de opciones para variantes multi-dimensionales (máx 3 grupos, 20 valores c/u)
  const optionGroups = Array.isArray(body?.optionGroups)
    ? body.optionGroups
        .map((g) => ({
          name: cleanSoft(g?.name, { max: 40 }),
          values: Array.isArray(g?.values)
            ? g.values.map((v) => cleanSoft(String(v), { max: 60 })).filter(Boolean).slice(0, 20)
            : [],
        }))
        .filter((g) => g.name && g.values.length > 0)
        .slice(0, 3)
    : []

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

  // Productos relacionados (selección manual). Array de ObjectIds, máx 12.
  const relatedProducts = Array.isArray(body?.relatedProducts)
    ? body.relatedProducts
        .map((r) => (r?._id ? String(r._id) : String(r)))
        .filter((id) => validator.isMongoId(id))
        .slice(0, 12)
    : []

  // Material en texto libre — opcional
  const materialText = cleanSoft(body?.materialText, { max: 200 })

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

  // Estado y publicación programada
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
  if (!description || description.length < 5)
    errors.push('La descripción es obligatoria (mín. 5 caracteres)')
  if (!Number.isFinite(price) || price < 0)
    errors.push('El precio debe ser un número positivo')
  if (comparePrice !== null && (!Number.isFinite(comparePrice) || comparePrice < 0))
    errors.push('El precio comparativo debe ser un número positivo')
  if (wholesalePrice !== null) {
    if (!Number.isFinite(wholesalePrice) || wholesalePrice < 0)
      errors.push('El precio de mayoreo debe ser un número positivo')
    else if (Number.isFinite(price) && wholesalePrice >= price)
      errors.push('El precio de mayoreo debe ser MENOR al precio normal')
    if (!Number.isFinite(wholesaleMinQty) || wholesaleMinQty < 2)
      errors.push('La cantidad mínima de mayoreo debe ser 2 o más')
  } else if (wholesaleMinQty !== null && wholesaleMinQty > 0) {
    errors.push('Definiste cantidad mínima de mayoreo pero falta el precio de mayoreo')
  }
  if (hundredPrice !== null) {
    if (!Number.isFinite(hundredPrice) || hundredPrice < 0)
      errors.push('El precio por ciento debe ser un número positivo')
    if (!Number.isFinite(hundredMinQty) || hundredMinQty < 2)
      errors.push('La cantidad mínima para precio por ciento debe ser 2 o más')
  } else if (hundredMinQty !== null && hundredMinQty > 0) {
    errors.push('Definiste cantidad mínima para precio por ciento pero falta el precio')
  }
  if (!categories.length || !categories.every((c) => validator.isMongoId(c)))
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
      wholesalePrice,
      wholesaleMinQty,
      hundredPrice,
      hundredMinQty,
      categories,
      image,
      gallery,
      variants,
      optionGroups,
      featured,
      active,
      stock,
      sku,
      status,
      publishAt,
      tags,
      brand,
      materials,
      materialText,
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
      relatedProducts,
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

  if (!name || name.length < 2)
    errors.push('El nombre de la categoría es obligatorio (mín. 2 caracteres)')
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
