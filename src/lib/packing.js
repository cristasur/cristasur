// ============================================================
// Empaquetado del carrito para cotizar envíos.
//
// EL PROBLEMA: la paquetería no cotiza productos, cotiza CAJAS.
// Hay que convertir "3 cubetas y 2 hieleras" en uno o varios
// bultos con peso y medidas.
//
// EL DATO QUE MANDA: el peso volumétrico. Envia.com lo calcula
// así (confirmado en su cotizador):
//
//     volumétrico (kg) = largo × ancho × alto (cm) ÷ 5000
//
// Y te cobran el MAYOR entre el peso real y el volumétrico. Para
// plásticos —ligeros y voluminosos— casi siempre gana el
// volumétrico. Una cubeta de 19 L pesa 1.5 kg y se cobra como 9.8.
//
// Por eso NO se puede cotizar mandando solo el peso: saldría una
// tarifa que luego no se cumple y la diferencia la paga el negocio.
//
// CÓMO LO RESOLVEMOS: mandamos las cajas REALES. Las medidas que
// el admin captura en pkgLength/pkgWidth/pkgHeight ya describen un
// bulto listo para embarcar, así que cada unidad vendible es una
// caja y se cotiza tal cual.
//
// Esto es más exacto que inventar una caja combinada: si pides dos
// hieleras, viajan en dos cajas y así se cotiza. Nada de holguras
// ni cubos imaginarios que inflen el precio.
// ============================================================

/** Divisor volumétrico de Envia.com. */
export const VOLUMETRIC_DIVISOR = 5000

// Arriba de esto ya es carga consolidada: se cotiza a mano.
const MAX_BOXES = 20

// Varias paqueterías rechazan lados menores a ~15 cm.
const MIN_SIDE_CM = 15

/** Peso volumétrico de una caja. */
export function volumetricWeight({ length, width, height }) {
  const v = (Number(length) || 0) * (Number(width) || 0) * (Number(height) || 0)
  return v / VOLUMETRIC_DIVISOR
}

/** Peso facturable: el mayor entre el real y el volumétrico. */
export function billableWeight(pkg) {
  return Math.max(Number(pkg.weight) || 0, volumetricWeight(pkg.dimensions || pkg))
}

/**
 * Saca peso y medidas de UNA unidad vendible del producto.
 *
 * Prioriza los campos de paquete (pkgWeight / pkgLength / …), que
 * describen la caja lista para embarcar. Si el producto se vende
 * por múltiplos (qtyStep), esas medidas ya son las del paquete
 * completo, no las de una pieza suelta.
 *
 * Devuelve null si falta cualquier dato: sin medidas no hay
 * cotización posible y es mejor decirlo que inventar un número.
 */
export function unitBox(product) {
  const num = (v) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : null
  }

  const weight = num(product?.pkgWeight) ?? num(product?.weight)
  const length = num(product?.pkgLength) ?? num(product?.length)
  const width  = num(product?.pkgWidth)  ?? num(product?.width)
  const height = num(product?.pkgHeight) ?? num(product?.height)

  if (!weight || !length || !width || !height) return null

  return { weight, length, width, height, volume: length * width * height }
}

/**
 * Convierte las líneas del carrito en cajas para cotizar.
 *
 * `lines`: [{ product, qty }] — product ya viene de la BD.
 *
 * Devuelve:
 *   packages  — arreglo listo para mandar a Envia
 *   missing   — productos sin medidas capturadas (bloquean la cotización)
 *   totals    — peso real, volumétrico y facturable, para mostrar/diagnosticar
 */
export function planPackages(lines, { declaredValue = 0 } = {}) {
  const missing = []
  const boxes = []

  for (const { product, qty } of lines) {
    const n = Math.max(1, Math.floor(Number(qty) || 1))
    const box = unitBox(product)

    if (!box) {
      missing.push({
        id: String(product?._id || ''),
        name: product?.name || 'Producto',
        sku: product?.sku || '',
      })
      continue
    }

    // Si el producto se vende por múltiplos, la caja capturada ya
    // corresponde a un paquete completo: 12 platos con qtyStep 6
    // son dos cajas, no doce.
    const step = Number(product?.qtyStep) > 1 ? Number(product.qtyStep) : 1
    const count = Math.ceil(n / step)

    for (let i = 0; i < count; i++) boxes.push(box)
  }

  // Con un solo producto sin medidas la cotización no es confiable.
  if (missing.length) return { packages: [], missing, totals: null }
  if (!boxes.length) return { packages: [], missing: [], totals: null }

  // Pedidos enormes no se cotizan en automático: son carga
  // consolidada y se negocian a mano.
  if (boxes.length > MAX_BOXES) {
    return { packages: [], missing: [], totals: null, tooLarge: true }
  }

  const perBox = (Number(declaredValue) || 0) / boxes.length

  const packages = boxes.map((b) => ({
    type: 'box',
    content: 'Artículos para el hogar',
    amount: 1,
    declaredValue: Math.round(perBox),
    lengthUnit: 'CM',
    weightUnit: 'KG',
    weight: Math.max(0.5, Math.round(b.weight * 100) / 100),
    dimensions: {
      length: Math.max(MIN_SIDE_CM, b.length),
      width:  Math.max(MIN_SIDE_CM, b.width),
      height: Math.max(MIN_SIDE_CM, b.height),
    },
  }))

  const realWeight = packages.reduce((s, p) => s + p.weight, 0)
  const volWeight  = packages.reduce((s, p) => s + volumetricWeight(p.dimensions), 0)
  const billWeight = packages.reduce((s, p) => s + billableWeight(p), 0)

  return {
    packages,
    missing: [],
    totals: {
      packages: packages.length,
      realWeight: Math.round(realWeight * 100) / 100,
      volumetricWeight: Math.round(volWeight * 100) / 100,
      billableWeight: Math.round(billWeight * 100) / 100,
    },
  }
}
