// ============================================================
// Código postal → estado (México)
//
// POR QUÉ EXISTE: las paqueterías exigen el estado del destino,
// pero en el carrito el cliente solo escribe su código postal.
// Envia.com rechaza la cotización con "String is too short at
// destination -> properties:state" si va vacío.
//
// Se resuelve con tabla local en vez de llamar a otra API:
//   · Cero latencia — importa con el límite de 10 s de Vercel.
//   · Cero puntos de falla adicionales.
//   · En México los dos primeros dígitos del CP determinan el
//     estado de forma fija (SEPOMEX). No es heurística.
// ============================================================

// [desde, hasta, código, nombre] — rangos de los 2 primeros dígitos.
const RANGES = [
  [ 1, 16, 'CX', 'Ciudad de México'],
  [20, 20, 'AG', 'Aguascalientes'],
  [21, 22, 'BC', 'Baja California'],
  [23, 23, 'BS', 'Baja California Sur'],
  [24, 24, 'CM', 'Campeche'],
  [25, 27, 'CO', 'Coahuila'],
  [28, 28, 'CL', 'Colima'],
  [29, 30, 'CS', 'Chiapas'],
  [31, 33, 'CH', 'Chihuahua'],
  [34, 35, 'DG', 'Durango'],
  [36, 38, 'GT', 'Guanajuato'],
  [39, 41, 'GR', 'Guerrero'],
  [42, 43, 'HG', 'Hidalgo'],
  [44, 49, 'JA', 'Jalisco'],
  [50, 57, 'EM', 'México'],
  [58, 61, 'MI', 'Michoacán'],
  [62, 62, 'MO', 'Morelos'],
  [63, 63, 'NA', 'Nayarit'],
  [64, 67, 'NL', 'Nuevo León'],
  [68, 71, 'OA', 'Oaxaca'],
  [72, 75, 'PU', 'Puebla'],
  [76, 76, 'QT', 'Querétaro'],
  [77, 77, 'QR', 'Quintana Roo'],
  [78, 79, 'SL', 'San Luis Potosí'],
  [80, 82, 'SI', 'Sinaloa'],
  [83, 85, 'SO', 'Sonora'],
  [86, 86, 'TB', 'Tabasco'],
  [87, 89, 'TM', 'Tamaulipas'],
  [90, 90, 'TL', 'Tlaxcala'],
  [91, 96, 'VE', 'Veracruz'],
  [97, 98, 'YU', 'Yucatán'],
  [99, 99, 'ZA', 'Zacatecas'],
]

/**
 * Devuelve { code, name } del estado al que pertenece un CP,
 * o null si el código postal no es válido.
 */
export function stateFromPostalCode(postalCode) {
  const cp = String(postalCode || '').replace(/\D/g, '')
  if (cp.length !== 5) return null

  const prefix = Number(cp.slice(0, 2))
  if (!Number.isFinite(prefix)) return null

  for (const [from, to, code, name] of RANGES) {
    if (prefix >= from && prefix <= to) return { code, name }
  }
  return null
}

/** true si el CP tiene forma válida y cae en un estado conocido. */
export function isValidMexicanPostalCode(postalCode) {
  return stateFromPostalCode(postalCode) !== null
}
