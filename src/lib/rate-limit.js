// ============================================================
// src/lib/rate-limit.js
// Rate limiter en memoria con ventana deslizante por clave.
// Para producción seria con múltiples instancias se debería migrar
// a Redis/Upstash. Para una sola instancia (Node/Vercel) cumple
// para ataques de fuerza bruta a /login, abuso de import, etc.
// ============================================================

const STORE = new Map() // key -> { count, resetAt }

// Hace cleanup ocasional de entradas viejas
let lastCleanup = Date.now()
function gc() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [k, v] of STORE.entries()) {
    if (v.resetAt < now) STORE.delete(k)
  }
}

/**
 * Devuelve { ok, remaining, retryAfter } y muta el contador.
 * @param {string} key      Identificador (IP, email, etc.)
 * @param {number} max      Máximo de hits permitidos
 * @param {number} windowMs Ventana en ms
 */
export function rateLimit(key, max, windowMs) {
  gc()
  const now = Date.now()
  const entry = STORE.get(key)
  if (!entry || entry.resetAt < now) {
    STORE.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfter: 0 }
  }
  if (entry.count >= max) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }
  entry.count++
  return {
    ok: true,
    remaining: max - entry.count,
    retryAfter: 0,
  }
}

// Útil para resetear tras un login exitoso (limpia la "deuda" del usuario).
export function rateLimitReset(key) {
  STORE.delete(key)
}

// Extrae la IP del cliente respetando los headers de proxy más comunes.
export function clientIp(request) {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}
