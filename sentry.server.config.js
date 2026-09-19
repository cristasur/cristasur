// ============================================================
// Sentry — configuración del servidor (Node runtime).
// Captura errores de:
//   - API routes (/api/*)
//   - Server Components / Server Actions
//   - Database calls (MongoDB errors)
//   - Cron jobs
// ============================================================
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',

  // 10% de transacciones para performance monitoring.
  tracesSampleRate: 0.1,

  // Sanitización server-side: nunca mandamos tokens, hashes o secretos.
  beforeSend(event) {
    if (event.request?.data && typeof event.request.data === 'object') {
      const d = event.request.data
      if (d.password) d.password = '[REDACTED]'
      if (d.totpCode) d.totpCode = '[REDACTED]'
      if (d.backupCode) d.backupCode = '[REDACTED]'
      if (d.totpSecret) d.totpSecret = '[REDACTED]'
    }
    // Nunca enviamos cookies (contienen JWT del admin).
    if (event.request?.cookies) delete event.request.cookies
    // Ni headers de autorización.
    if (event.request?.headers) {
      delete event.request.headers.authorization
      delete event.request.headers.cookie
    }
    return event
  },

  ignoreErrors: [
    // Aborts normales (usuario cierra pestaña durante request).
    'AbortError',
    'Request aborted',
    // MongoDB timeouts esporádicos que se resuelven en el siguiente request.
    'MongoNetworkTimeoutError',
  ],
})
