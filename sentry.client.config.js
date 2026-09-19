// ============================================================
// Sentry — configuración del cliente (browser).
// Captura errores de JavaScript, hidration, componentes React,
// promesas no manejadas y llamadas fetch fallidas.
// ============================================================
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Marca el entorno para poder filtrar producción vs preview vs dev en la UI.
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',

  // Muestreo de performance: 10% en producción para no gastar cuota gratis.
  // 0 = solo errores; 1.0 = todas las transacciones.
  tracesSampleRate: 0.1,

  // Reemplaza patrones sensibles en breadcrumbs y datos capturados.
  beforeSend(event) {
    // No enviamos passwords aunque aparezcan por accidente en algún form.
    if (event.request?.data && typeof event.request.data === 'object') {
      const d = event.request.data
      if (d.password) d.password = '[REDACTED]'
      if (d.totpCode) d.totpCode = '[REDACTED]'
      if (d.backupCode) d.backupCode = '[REDACTED]'
    }
    return event
  },

  // No reportamos errores de bots, extensiones de Chrome, ni scripts externos
  // que solo hacen ruido y no son bugs reales del proyecto.
  ignoreErrors: [
    // Extensiones que inyectan scripts (comunes en admins con muchas extensiones).
    'top.GLOBALS',
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Fetch abortado por el navegador (usuario cambió de página).
    'AbortError',
    'The user aborted a request',
    // Network errors normales (mala señal, no bug de código).
    'NetworkError',
    'Load failed',
    'Failed to fetch',
    // Chrome extensions.
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
  ],

  // Reduce ruido de scripts de terceros que no controlamos.
  denyUrls: [
    /chrome-extension:\/\//i,
    /moz-extension:\/\//i,
    /googletagmanager\.com/i,
    /google-analytics\.com/i,
  ],
})
