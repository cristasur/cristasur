// ============================================================
// GET /api/debug/sentry-test — lanza un error intencional para
// verificar que Sentry lo captura. Solo admin puede llamarlo.
// Después de deployar, visita esta URL y revisa Sentry Issues.
// ============================================================
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await getCurrentUser()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // 1) Reporta un mensaje manual (para probar transporte).
  Sentry.captureMessage('Sentry test message desde CRISTASUR', 'info')

  // 2) Reporta una exception capturada.
  try {
    throw new Error('Sentry test: excepción controlada de CRISTASUR')
  } catch (err) {
    Sentry.captureException(err)
  }

  // 3) Lanza una excepción REAL (no capturada) para que Sentry la
  //    tome del handler automático de Next.js.
  throw new Error(
    'Sentry test: error no manejado — si ves este mensaje en Sentry, todo funciona.'
  )
}
