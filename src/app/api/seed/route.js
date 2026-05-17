// ============================================================
// POST /api/seed
// SÓLO disponible en desarrollo. En producción devuelve 404 sin
// importar la cabecera. Para sembrar datos en producción, ejecuta
// `npm run seed` directamente (offline) en el servidor.
// En desarrollo, requiere cabecera `x-seed-key` que coincida con
// SEED_KEY (o JWT_SECRET).
// ============================================================
import { NextResponse } from 'next/server'
import { runSeed } from '@/lib/seed-data'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  // En producción este endpoint no existe (devuelve 404 plano).
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_API_SEED !== '1') {
    return new NextResponse('Not found', { status: 404 })
  }

  const provided = request.headers.get('x-seed-key') || ''
  const expected = process.env.SEED_KEY || process.env.JWT_SECRET
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    const result = await runSeed()
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('SEED error', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
