// ============================================================
// POST /api/auth/2fa/enable
// Confirma el enrolamiento verificando un código válido.
// Body: { code: "123456" }
// Al activar, genera 10 códigos de respaldo (mostrados 1 sola vez).
// ============================================================
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { verifyCode, generateBackupCodes } from '@/lib/totp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  const session = await getCurrentUser()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const code = String(body?.code || '').replace(/\s+/g, '')

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: 'El código debe ser de 6 dígitos' },
      { status: 400 }
    )
  }

  await dbConnect()
  const user = await User.findById(session.sub).select('+totpSecret')
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }
  if (!user.totpSecret) {
    return NextResponse.json(
      { error: 'Primero llama a /api/auth/2fa/setup para generar tu secreto.' },
      { status: 400 }
    )
  }
  if (user.totpEnabled) {
    return NextResponse.json({ error: '2FA ya está activo' }, { status: 409 })
  }

  const ok = verifyCode(user.totpSecret, code)
  if (!ok) {
    return NextResponse.json(
      { error: 'Código inválido. Verifica la hora de tu celular e intenta de nuevo.' },
      { status: 401 }
    )
  }

  // Generar códigos de respaldo (uno por línea, formato XXXX-XXXXXXXX).
  // Se muestran UNA SOLA VEZ al usuario. Se guardan hasheados.
  const plainBackupCodes = generateBackupCodes(10)
  const hashed = await Promise.all(
    plainBackupCodes.map((c) => bcrypt.hash(c, 10))
  )

  user.totpEnabled = true
  user.backupCodes = hashed
  await user.save()

  return NextResponse.json({
    ok: true,
    backupCodes: plainBackupCodes,
    message:
      'Guarda estos códigos en un lugar seguro. Cada uno solo se puede usar una vez si pierdes tu celular.',
  })
}
