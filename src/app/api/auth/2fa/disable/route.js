// ============================================================
// POST /api/auth/2fa/disable
// Desactiva 2FA. Requiere confirmar la contraseña actual (aunque
// esté logueado) para prevenir que alguien con sesión activa
// desactive el 2FA sin permiso.
// Body: { password: "..." }
// ============================================================
import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request) {
  const session = await getCurrentUser()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!password) {
    return NextResponse.json(
      { error: 'Debes ingresar tu contraseña para desactivar 2FA' },
      { status: 400 }
    )
  }

  await dbConnect()
  const user = await User.findById(session.sub).select('+totpSecret +backupCodes')
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  const passOk = await user.comparePassword(password)
  if (!passOk) {
    return NextResponse.json(
      { error: 'Contraseña incorrecta' },
      { status: 401 }
    )
  }

  user.totpEnabled = false
  user.totpSecret = null
  user.backupCodes = []
  await user.save()

  return NextResponse.json({ ok: true, message: '2FA desactivado' })
}
