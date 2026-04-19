// ============================================================
// src/lib/validation.js
// Funciones de validación y sanitización de inputs.
// Complementa a la validación del modelo Mongoose.
// ============================================================
import validator from 'validator'

// Sanitiza una cadena general: trim + escape de HTML (evita XSS)
export function cleanString(str, { max = 500 } = {}) {
  if (typeof str !== 'string') return ''
  const t = str.trim().slice(0, max)
  return validator.escape(t)
}

// Versión que permite caracteres extendidos (emoji) pero limita tamaño
export function cleanSoft(str, { max = 2000 } = {}) {
  if (typeof str !== 'string') return ''
  return str.trim().slice(0, max)
}

// Validación básica de email
export function isValidEmail(email) {
  return typeof email === 'string' && validator.isEmail(email)
}

// Valida payload de producto (al crear/editar)
export function validateProductPayload(body) {
  const errors = []
  const name = cleanSoft(body?.name, { max: 120 })
  const description = cleanSoft(body?.description, { max: 2000 })
  const price = Number(body?.price)
  const comparePrice = body?.comparePrice !== undefined && body?.comparePrice !== null && body?.comparePrice !== ''
    ? Number(body.comparePrice)
    : null
  const categories = Array.isArray(body?.categories) ? body.categories.map(c => typeof c === 'string' ? c.trim() : '').filter(Boolean) : []
  const image = cleanSoft(body?.image, { max: 500 })
  const featured = Boolean(body?.featured)
  const active = body?.active === undefined ? true : Boolean(body.active)
  const stock = body?.stock === undefined ? 0 : Number(body.stock)
  const sku = body?.sku ? cleanString(body.sku, { max: 40 }) : undefined

  if (!name || name.length < 2) errors.push('El nombre es obligatorio (mín. 2 caracteres)')
  if (!description || description.length < 5) errors.push('La descripción es obligatoria (mín. 5 caracteres)')
  if (!Number.isFinite(price) || price < 0) errors.push('El precio debe ser un número positivo')
  if (comparePrice !== null && (!Number.isFinite(comparePrice) || comparePrice < 0)) {
    errors.push('El precio comparativo debe ser un número positivo')
  }
  if (!categories.length || !categories.every(c => validator.isMongoId(c))) errors.push('Debe seleccionar al menos una categoría válida')
  if (!Number.isFinite(stock) || stock < 0) errors.push('El stock debe ser un número positivo')

  return {
    errors,
    value: {
      name,
      description,
      price,
      comparePrice,
      categories,
      image,
      featured,
      active,
      stock,
      sku,
    },
  }
}

export function validateCategoryPayload(body) {
  const errors = []
  const name = cleanSoft(body?.name, { max: 60 })
  const description = cleanSoft(body?.description, { max: 300 })
  const icon = cleanSoft(body?.icon, { max: 10 })
  const image = cleanSoft(body?.image, { max: 500 })
  const order = Number.isFinite(Number(body?.order)) ? Number(body.order) : 0
  const active = body?.active === undefined ? true : Boolean(body.active)
  const featured = Boolean(body?.featured)

  if (!name || name.length < 2) errors.push('El nombre de la categoría es obligatorio (mín. 