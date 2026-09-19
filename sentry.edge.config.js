// ============================================================
// Sentry — configuración del Edge runtime.
// Captura errores del middleware.js (que corre en Edge, no en Node).
// Aquí no hay acceso a Node APIs, solo web APIs.
// ============================================================
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 0.1,
})
