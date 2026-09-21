// ============================================================
// Cliente de la API de Envia.com
//
// Docs: https://docs.envia.com/docs/core-workflow
//   Producción : https://api.envia.com/
//   Pruebas    : https://api-test.envia.com/
//   Auth       : Authorization: Bearer <token>
//
// OJO CON ESTO: la API cotiza UNA paquetería por petición. Para
// comparar precios hay que lanzar varias en paralelo y juntar los
// resultados. Por eso existe quoteAllCarriers().
//
// Vercel Hobby corta las funciones a los 10 s, así que cada
// petición lleva su propio límite de tiempo y las lentas se
// descartan en vez de tumbar toda la cotización.
// ============================================================

const PROD_URL = 'https://api.envia.com'
const TEST_URL = 'https://api-test.envia.com'

// Tiempo máximo por paquetería. Con 4 en paralelo y 6 s cada una,
// el peor caso sigue cabiendo en el límite de Vercel.
const CARRIER_TIMEOUT_MS = 6000

// Paqueterías a cotizar. Se puede sobreescribir con ENVIA_CARRIERS
// (separadas por coma) sin tocar código.
const DEFAULT_CARRIERS = ['fedex', 'paquetexpress', 'dhl', 'estafeta']

export function enviaConfig() {
  const token = process.env.ENVIA_TOKEN || ''
  // Mientras no se declare producción explícitamente, usamos pruebas:
  // es preferible cotizar de mentiras que generar cargos reales por error.
  const isProd = process.env.ENVIA_ENV === 'production'
  const carriers = (process.env.ENVIA_CARRIERS || '')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)

  return {
    token,
    baseUrl: isProd ? PROD_URL : TEST_URL,
    isProd,
    carriers: carriers.length ? carriers : DEFAULT_CARRIERS,
    configured: Boolean(token),
  }
}

/** Dirección de origen: la Matriz. Se configura por variables de entorno. */
export function originAddress() {
  return {
    name:       process.env.ENVIA_ORIGIN_NAME     || 'CRISTASUR',
    company:    process.env.ENVIA_ORIGIN_COMPANY  || 'CRISTASUR',
    email:      process.env.ENVIA_ORIGIN_EMAIL    || '',
    phone:      process.env.ENVIA_ORIGIN_PHONE    || '',
    street:     process.env.ENVIA_ORIGIN_STREET   || '',
    number:     process.env.ENVIA_ORIGIN_NUMBER   || '',
    district:   process.env.ENVIA_ORIGIN_DISTRICT || '',
    city:       process.env.ENVIA_ORIGIN_CITY     || 'Mérida',
    state:      process.env.ENVIA_ORIGIN_STATE    || 'YU',
    country:    'MX',
    postalCode: process.env.ENVIA_ORIGIN_CP       || '',
  }
}

/** Faltan datos de origen sin los que ninguna paquetería cotiza. */
export function originIsComplete() {
  const o = originAddress()
  return Boolean(o.postalCode && o.street && o.phone)
}

/**
 * Cotiza con UNA paquetería.
 * Devuelve [] si falla: un transportista caído no debe tumbar el resto.
 */
async function quoteOne({ carrier, origin, destination, packages, baseUrl, token }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CARRIER_TIMEOUT_MS)

  try {
    const res = await fetch(`${baseUrl}/ship/rate/`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin,
        destination,
        packages,
        shipment: { type: 1, carrier },
      }),
    })

    if (!res.ok) {
      // 4xx suele ser dirección incompleta o sin cobertura de esa paquetería.
      return { carrier, ok: false, rates: [], error: `HTTP ${res.status}` }
    }

    const json = await res.json()
    const rows = Array.isArray(json?.data) ? json.data : []

    const rates = rows
      .map((r) => ({
        carrier: String(r.carrier || carrier),
        service: String(r.service || ''),
        serviceName: String(r.serviceDescription || r.service || ''),
        deliveryEstimate: String(r.deliveryEstimate || ''),
        price: Number(r.totalPrice),
        currency: String(r.currency || 'MXN'),
      }))
      .filter((r) => Number.isFinite(r.price) && r.price > 0)

    return { carrier, ok: true, rates }
  } catch (err) {
    const motivo = err?.name === 'AbortError' ? 'timeout' : (err?.message || 'error')
    return { carrier, ok: false, rates: [], error: motivo }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Cotiza con todas las paqueterías configuradas, en paralelo.
 *
 * Devuelve { rates, errors }:
 *   rates  — todas las opciones encontradas, de más barata a más cara
 *   errors — qué paquetería falló y por qué (para diagnosticar, no para el cliente)
 */
export async function quoteAllCarriers({ destination, packages }) {
  const cfg = enviaConfig()
  if (!cfg.configured) {
    return { rates: [], errors: [{ carrier: '*', error: 'Falta ENVIA_TOKEN' }] }
  }

  const origin = originAddress()

  const results = await Promise.all(
    cfg.carriers.map((carrier) =>
      quoteOne({
        carrier,
        origin,
        destination,
        packages,
        baseUrl: cfg.baseUrl,
        token: cfg.token,
      })
    )
  )

  const rates = results
    .flatMap((r) => r.rates)
    .sort((a, b) => a.price - b.price)

  const errors = results
    .filter((r) => !r.ok)
    .map((r) => ({ carrier: r.carrier, error: r.error }))

  return { rates, errors }
}
