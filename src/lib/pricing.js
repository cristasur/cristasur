// ============================================================
// Lógica de precios escalonados de CRISTASUR.
//
// Tres niveles, todos tomados del producto padre (nunca de la variante):
//   1. price                          → menudeo, desde 1 pieza
//   2. wholesalePrice / wholesaleMinQty → mayoreo
//   3. hundredPrice  / hundredMinQty    → precio por ciento
//
// Se usa en la tarjeta del catálogo y en la ficha de producto para que
// ambas muestren exactamente el mismo número.
// ============================================================

/** Devuelve los niveles válidos, ordenados de menor a mayor cantidad. */
export function priceTiers(product) {
  const base = Number(product?.price) || 0
  const tiers = [{ minQty: 1, price: base, label: 'Menudeo' }]

  const wp = Number(product?.wholesalePrice)
  const wq = Number(product?.wholesaleMinQty)
  if (Number.isFinite(wp) && wp > 0 && Number.isFinite(wq) && wq > 1) {
    tiers.push({ minQty: wq, price: wp, label: 'Mayoreo' })
  }

  const hp = Number(product?.hundredPrice)
  const hq = Number(product?.hundredMinQty)
  if (Number.isFinite(hp) && hp > 0 && Number.isFinite(hq) && hq > 1) {
    tiers.push({ minQty: hq, price: hp, label: 'Por ciento' })
  }

  return tiers.sort((a, b) => a.minQty - b.minQty)
}

/** Precio unitario que aplica para una cantidad dada. */
export function unitPriceFor(product, qty) {
  const tiers = priceTiers(product)
  let price = tiers[0].price
  for (const t of tiers) {
    if (qty >= t.minQty) price = t.price
  }
  return price
}

/** El nivel activo para una cantidad dada. */
export function activeTier(product, qty) {
  const tiers = priceTiers(product)
  let active = tiers[0]
  for (const t of tiers) {
    if (qty >= t.minQty) active = t
  }
  return active
}

/**
 * Descuento máximo disponible, en porcentaje entero.
 * 0 si el producto no tiene precios escalonados.
 */
export function maxTierDiscount(product) {
  const tiers = priceTiers(product)
  if (tiers.length < 2) return 0
  const base = tiers[0].price
  const cheapest = Math.min(...tiers.map((t) => t.price))
  if (!base || cheapest >= base) return 0
  return Math.round(((base - cheapest) / base) * 100)
}

/**
 * Múltiplo de venta. qtyStep = 6 significa que solo se puede pedir
 * 6, 12, 18… null o 1 = de uno en uno.
 */
export function saleStep(product) {
  const s = Number(product?.qtyStep)
  return Number.isFinite(s) && s > 1 ? s : 1
}

/** Ajusta una cantidad al múltiplo de venta más cercano hacia arriba. */
export function snapToStep(qty, step) {
  if (step <= 1) return Math.max(1, Math.round(qty))
  return Math.max(step, Math.ceil(qty / step) * step)
}

export function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(Number(n) || 0)
}

/** Igual que formatMXN pero sin centavos, para precios redondos. */
export function formatMXNShort(n) {
  const v = Number(n) || 0
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
  }).format(v)
}
