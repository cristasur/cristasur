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

// Queries API: catálogos (paqueterías, servicios, direcciones…)
const QUERIES_PROD = 'https://queries.envia.com'
const QUERIES_TEST = 'https://queries.test.envia.com'

// Orden de preferencia para cotizar en México. La API cobra una
// petición por paquetería, así que no se pueden pedir todas: se
// eligen las que de verdad sirven para paquetería nacional.
const PREFERRED_MX = [
  'fedex', 'paquetexpress', 'estafeta', 'dhl', 'ups', 'ampm', 'coordinadora',
]

// Cuántas cotizar en paralelo. Con el límite de 10 s de Vercel,
// más de 5 es arriesgado.
const MAX_CARRIERS = 5

// Tiempo máximo por paquetería. Con 4 en paralelo y 6 s cada una,
// el peor caso sigue cabiendo en el límite de Vercel.
const CARRIER_TIMEOUT_MS = 6000

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
    queriesUrl: isProd ? QUERIES_PROD : QUERIES_TEST,
    isProd,
    // Vacío = descubrir por API. Con ENVIA_CARRIERS se fuerza la lista.
    carriers,
    configured: Boolean(token),
  }
}

// ── Descubrimiento de paqueterías ───────────────────────────
// Los identificadores exactos los da la Queries API; adivinarlos
// produce cotizaciones vacías sin ningún error visible.
let carrierCache = { at: 0, list: null }
const CARRIER_TTL_MS = 60 * 60 * 1000

export async function fetchAvailableCarriers({ country = 'MX' } = {}) {
  const cfg = enviaConfig()
  if (!cfg.configured) return []

  if (carrierCache.list && Date.now() - carrierCache.at < CARRIER_TTL_MS) {
    return carrierCache.list
  }

  try {
    const res = await fetch(
      `${cfg.queriesUrl}/carrier?country_code=${encodeURIComponent(country)}`,
      {
        headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return []
    const json = await res.json()
    const rows = Array.isArray(json?.data) ? json.data : []
    // Se conserva la capitalización original: hay identificadores como
    // "amPm" que no funcionan en minúsculas.
    const names = rows
      .filter((c) => c?.active !== false)
      .map((c) => String(c?.name || '').trim())
      .filter(Boolean)

    carrierCache = { at: Date.now(), list: names }
    return names
  } catch {
    return []
  }
}

/** Qué paqueterías cotizar: configuradas, o descubiertas y priorizadas. */
export async function resolveCarriers() {
  const cfg = enviaConfig()
  if (cfg.carriers.length) return cfg.carriers.slice(0, MAX_CARRIERS)

  const available = await fetchAvailableCarriers()
  if (!available.length) return PREFERRED_MX.slice(0, MAX_CARRIERS)

  // Primero las preferidas que existan; si faltan, se rellena con el resto.
  // La comparación es sin distinguir mayúsculas, pero se devuelve el
  // identificador tal cual lo reporta Envia.
  const byLower = new Map(available.map((c) => [c.toLowerCase(), c]))
  const preferred = PREFERRED_MX.map((c) => byLower.get(c)).filter(Boolean)
  const rest = available.filter((c) => !preferred.includes(c))
  return [...preferred, ...rest].slice(0, MAX_CARRIERS)
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

    // OJO: Envia responde HTTP 200 aunque haya fallado; el error va en
    // el cuerpo como { meta: "error", error: { message } }. Sin esta
    // comprobación los fallos se ven como "sin tarifas" y no hay forma
    // de saber qué pasó.
    if (json?.meta === 'error' || json?.error) {
      const msg = json?.error?.message || json?.error?.description || 'error desconocido'
      return { carrier, ok: false, rates: [], error: msg }
    }

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
  const carriers = await resolveCarriers()

  const results = await Promise.all(
    carriers.map((carrier) =>
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
