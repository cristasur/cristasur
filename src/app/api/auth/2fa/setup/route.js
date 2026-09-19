// ============================================================
// POST /api/auth/2fa/setup
// Inicia el enrolamiento: genera un secret nuevo y devuelve
// el URI otpauth:// + un QR (data URL) para escanear.
// El secret se guarda TEMPORAL en la BD pero con totpEnabled=false —
// no se activa hasta que el usuario confirme con /enable.
// Requiere sesión iniciada.
// ============================================================
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { generateSecret, otpauthURL } from '@/lib/totp'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST() {
  const session = await getCurrentUser()
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  await dbConnect()
  const user = await User.findById(session.sub).select('+totpSecret email')
  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  // Si ya lo tiene activo, no permitir re-setup sin desactivar primero
  if (user.totpEnabled) {
    return NextResponse.json(
      { error: '2FA ya está activo. Desactívalo antes de configurar otra vez.' },
      { status: 409 }
    )
  }

  const secret = generateSecret()
  user.totpSecret = secret
  user.totpEnabled = false
  await user.save()

  const uri = otpauthURL({
    secret,
    account: user.email,
    issuer: 'CRISTASUR',
  })

  const qrDataUrl = await QRCode.toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#0f172a', light: '#ffffff' },
  })

  return NextResponse.json({
    ok: true,
    secret,        // se muestra al usuario en caso de que no pueda escanear
    otpauthUrl: uri,
    qrDataUrl,
  })
}
