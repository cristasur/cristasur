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
      const label = cleanSoft(v?.label, { max: 60 })
      const value = cleanSoft(v?.value, { max: 60 })
      if (!label || !value) return null
      const priceN = v?.price === '' || v?.price == null ? null : Number(v.price)
      const cmpN =
        v?.comparePrice === '' || v?.comparePrice == null ? null : Number(v.comparePrice)
      const stockN = v?.stock === '' || v?.stock == null ? 0 : Number(v.stock)
      return {
        label,
        value,
        sku: v?.sku ? cleanString(v.sku, { max: 40 }) : undefined,
        price: Number.isFinite(priceN) && priceN >= 0 ? priceN : null,
        comparePrice: Number.isFinite(cmpN) && cmpN >= 0 ? cmpN : null,
        stock: Number.isFinite(stockN) && stockN >= 0 ? stockN : 0,
        image: cleanSoft(v?.image, { max: 500 }),
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

  const featured = Boolean(body?.featured)
  const active = body?.active === undefined ? true : Boolean(body.active)
  const stock = body?.stock === undefined ? 0 : Number(body.stock)
  const sku = body?.sku ? cleanString(body.sku, { max: 40 }) : undefined

  // Marca (ObjectId string) — opcional
  const brand =
    body?.brand && validator.isMongoId(String(body.brand)) ? String(body.brand) : null

  // Color libre (ej: "Rojo", "Azul marino") — opcional
  const color = cleanSoft(body?.color, { max: 60 })

  // ---- Dimensiones y logística ----
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

  // Validaciones de dimensiones (solo si se rellenan)
  if (weight !== null && weight > 999)
    errors.push('El peso no puede superar 999 kg')
  if (length !== null && length > 999)
    errors.push('El largo no puede superar 999 cm')
  if (width !== null && width > 999)
    errors.push('El ancho no puede superar 999 cm')
  if (height !== null && height > 999)
    errors.push('El alto no puede superar 999 cm')

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
  if (!categories.length || !categories.every((c) => validator.isMongoId(c)))
    errors.push('Debe seleccionar al menos una categoría válida')
  if (!Number.isFinite(stock) || stock < 0)
    errors.push('El stock debe ser un número positivo')

  return {
    errors,
    value: {
      name,
      description,
      price,
      comparePrice,
      wholesalePrice,
      wholesaleMinQty,
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
      color,
      weight,
      length,
      width,
      height,
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

// Resume los cambios de un producto en texto corto, para el historial.
export function diffSummary(before, after, fields) {
  const parts = []
  for (const f of fields) {
    const a = before?.[f]
    const b = after?.[f]
    const sa = typeof a === 'object' ? JSON.stringify(a) : String(a ?? '')
    const sb = typeof b === 'object' ? JSON.stringify(b) : String(b ?? '')
    if (sa !== sb) {
      const fmtA = sa.length > 30 ? sa.slice(0, 27) + '…' : sa
      const fmtB = sb.length > 30 ? sb.slice(0, 27) + '…' : sb
      parts.push(`${f}: ${fmtA || '∅'} → ${fmtB || '∅'}`)
    }
  }
  return parts.join(', ')
}
