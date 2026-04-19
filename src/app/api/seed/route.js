// ============================================================
// POST /api/seed
// Crea datos iniciales en la base de datos.
// Protegido por una cabecera 'x-seed-key' que debe coincidir con
// JWT_SECRET (o env SEED_KEY si se define aparte).
// También existe scripts/seed.js que ejecuta lo mismo offline.
// ============================================================
import { NextResponse } from 'next/server'
import { runSeed } from '@/lib/seed-data'

export const dynamic = 'force-dynamic'

export async function POST(request) {
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
