// ============================================================
// instrumentation.js — hook oficial de Next.js 14 para cargar
// código antes de que arranque la app. Sentry lo usa para
// inicializar el tracking según el runtime (Node vs Edge).
// ============================================================

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Captura errores no manejados en el servidor
export async function onRequestError(err, request, context) {
  const Sentry = await import('@sentry/nextjs')
  Sentry.captureRequestError(err, request, context)
}
