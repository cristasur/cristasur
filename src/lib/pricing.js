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

/**
 * Siguiente nivel de precio alcanzable, RESPETANDO el múltiplo de venta.
 *
 * Aquí vivía un bug: si el producto se vende de 4 en 4 y el mayoreo
 * empieza en 6, sugerir "sube a 6" es imposible de cumplir. El
 * siguiente válido es 8.
 *
 * Devuelve null si ya está en el mejor nivel o no hay más niveles.
 * Si no, { qty, faltan, price, label } con la cantidad REAL a la que
 * hay que subir.
 */
export function nextTierTarget(product, qty) {
  const tiers = priceTiers(product)
  const step = saleStep(product)
  const actual = activeTier(product, qty)

  const siguiente = tiers.find((t) => t.minQty > actual.minQty)
  if (!siguiente) return null

  // La cantidad real es el múltiplo de venta que alcanza ese nivel.
  const objetivo = snapToStep(siguiente.minQty, step)
  if (objetivo <= qty) return null

  return {
    qty: objetivo,
    faltan: objetivo - qty,
    price: siguiente.price,
    label: siguiente.label,
  }
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

// ============================================================
// Disponibilidad
// ============================================================

/**
 * Estado de stock REAL de un producto, considerando sus variantes.
 *
 * Bug que corrige: la tarjeta leía `product.stock` del padre. En el
 * modelo simétrico el padre es solo contenedor y su stock siempre es
 * null, así que un producto con todas sus variantes agotadas se
 * mostraba "Disponible" y se podía agregar al carrito.
 *
 * Devuelve { agotado, texto, unidades }.
 *   unidades = null significa sin control de inventario.
 */
export function stockState(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : []

  if (variants.length > 0) {
    const vendibles = variants.filter((v) => {
      if (v?.available === false) return false
      const s = Number(v?.stock)
      // stock null/indefinido = sin control de inventario → disponible
      return !Number.isFinite(s) || s > 0
    })

    if (vendibles.length === 0) {
      return { agotado: true, texto: 'Sin stock', unidades: 0 }
    }

    // Si alguna vendible no lleva conteo, no se puede sumar un total.
    const sinConteo = vendibles.some((v) => !Number.isFinite(Number(v?.stock)))
    if (sinConteo) return { agotado: false, texto: 'Disponible', unidades: null }

    const total = vendibles.reduce((s, v) => s + Number(v.stock), 0)
    return { agotado: false, texto: `${total} en stock`, unidades: total }
  }

  // Producto sin variantes: manda su propio stock.
  const s = Number(product?.stock)
  if (product?.stock === 0) return { agotado: true, texto: 'Sin stock', unidades: 0 }
  if (!Number.isFinite(s)) return { agotado: false, texto: 'Disponible', unidades: null }
  return { agotado: false, texto: `${s} en stock`, unidades: s }
}

/**
 * Normaliza un valor de existencias.
 *
 * OJO: Number(null) es 0 y Number.isFinite(0) es true, así que la
 * comprobación ingenua confunde "sin control de inventario" (null)
 * con "cero piezas" y bloquea la venta de todo el catálogo.
 * Devuelve null cuando no hay conteo, o un entero >= 0.
 */
export function toStock(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : null
}

/**
 * Unidades disponibles de una línea concreta (producto + variante).
 *
 * Devuelve null cuando no se lleva inventario (venta libre).
 * Devuelve 0 cuando está agotada.
 */
export function availableUnits(product, variantLabel, variantValue) {
  const variants = Array.isArray(product?.variants) ? product.variants : []

  if (variants.length && variantValue) {
    const norm = (x) => String(x || '').trim().toLowerCase()
    const v = variants.find(
      (x) =>
        norm(x.value) === norm(variantValue) &&
        (!variantLabel || norm(x.label) === norm(variantLabel))
    )
    if (!v) return 0                    // variante inexistente
    if (v.available === false) return 0
    return toStock(v.stock)
  }

  return toStock(product?.stock)
}
