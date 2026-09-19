// ============================================================
// POST /api/auth/login
// Verifica credenciales y setea cookie httpOnly con JWT.
// Capas de defensa:
//   1) Rate limit en memoria por IP y por email (contra fuerza bruta rápida).
//   2) Lockout persistente en BD por usuario (5 intentos fallidos → 15 min).
//   3) 2FA / TOTP obligatorio si el usuario lo activó.
// Flujo con 2FA:
//   - Cliente manda { email, password } → si el user tiene TOTP activo,
//     respondemos { needsTotp: true } sin sesión.
//   - Cliente manda de nuevo { email, password, totpCode } → validamos y
//     entregamos sesión.
// ============================================================
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, buildAuthCookie } from '@/lib/auth'
import { isValidEmail, cleanString } from '@/lib/validation'
import { rateLimit, rateLimitReset, clientIp } from '@/lib/rate-limit'
import { verifyCode } from '@/lib/totp'

export const dynamic = 'force-dynamic'

const MAX_PER_IP        = 10                   // 10 intentos
const MAX_PER_EMAIL     = 5                    // 5 intentos
const WINDOW_MS         = 15 * 60 * 1000       // por 15 min

// Lockout persistente en BD (más fuerte que rate limit en memoria)
const MAX_FAILED_BEFORE_LOCK = 5
const LOCK_DURATION_MS       = 15 * 60 * 1000  // 15 minutos

export async function POST(request) {
  try {
    const ip = clientIp(request)
    const ipCheck = rateLimit(`login:ip:${ip}`, MAX_PER_IP, WINDOW_MS)
    if (!ipCheck.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos desde esta dirección. Espera unos minutos e inténtalo de nuevo.' },
        { status: 429, headers: { 'Retry-After': String(ipCheck.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const email = cleanString(body.email, { max: 120 }).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const totpCode = typeof body.totpCode === 'string' ? body.totpCode.trim() : ''
    const backupCode = typeof body.backupCode === 'string' ? body.backupCode.trim().toUpperCase() : ''

    if (!isValidEmail(email) || password.length < 6) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 400 })
    }

    const emailCheck = rateLimit(`login:email:${email}`, MAX_PER_EMAIL, WINDOW_MS)
    if (!emailCheck.ok) {
      return NextResponse.json(
        { error: 'Demasiados intentos para esta cuenta. Espera unos minutos e inténtalo de nuevo.' },
        { status: 429, headers: { 'Retry-After': String(emailCheck.retryAfter) } }
      )
    }

    await dbConnect()
    // Traemos los campos sensitive (totpSecret, backupCodes) que están marcados select:false
    const user = await User.findOne({ email }).select('+totpSecret +backupCodes')
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    // ── Lockout ───────────────────────────────────────────────
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minsLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json(
        {
          error: `Cuenta bloqueada temporalmente por seguridad. Intenta en ${minsLeft} minuto${minsLeft === 1 ? '' : 's'}.`,
          lockedUntil: user.lockedUntil,
        },
        { status: 423 }
      )
    }

    // ── Password ──────────────────────────────────────────────
    const passOk = await user.comparePassword(password)
    if (!passOk) {
      await registerFailedAttempt(user)
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    // ── 2FA (si el usuario lo tiene activo) ───────────────────
    if (user.totpEnabled) {
      // Fase 1: si no vino código TOTP ni backup, pedirlo
      if (!totpCode && !backupCode) {
        return NextResponse.json({
          needsTotp: true,
          message: 'Ingresa el código de tu app autenticadora',
        })
      }

      let totpOk = false
      let backupUsed = false

      // Verificar código TOTP
      if (totpCode) {
        totpOk = verifyCode(user.totpSecret, totpCode)
      }
      // Si no matchea, intentar contra códigos de respaldo
      if (!totpOk && backupCode) {
        const codes = Array.isArray(user.backupCodes) ? user.backupCodes : []
        for (let i = 0; i < codes.length; i++) {
          const match = await bcrypt.compare(backupCode, codes[i])
          if (match) {
            totpOk = true
            backupUsed = i
            break
          }
        }
      }

      if (!totpOk) {
        await registerFailedAttempt(user)
        return NextResponse.json(
          { error: 'Código de verificación inválido', needsTotp: true },
          { status: 401 }
        )
      }

      // Si consumió un backup code, lo eliminamos (un solo uso)
      if (backupUsed !== false) {
        user.backupCodes.splice(backupUsed, 1)
      }
    }

    // ── Login exitoso — limpiar estado y firmar sesión ────────
    user.failedLoginAttempts = 0
    user.lockedUntil = null
    user.lastLoginAt = new Date()
    if (!user.emailVerified && ['admin', 'editor'].includes(user.role)) {
      user.emailVerified = true
    }
    await user.save()

    rateLimitReset(`login:ip:${ip}`)
    rateLimitReset(`login:email:${email}`)

    const token = await signToken({
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
      wholesaleAccess: Boolean(user.wholesaleAccess),
    })
    const res = NextResponse.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        wholesaleAccess: Boolean(user.wholesaleAccess),
      },
    })
    const cookie = buildAuthCookie(token)
    res.cookies.set(cookie.name, cookie.value, cookie)
    return res
  } catch (err) {
    console.error('login error', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// Incrementa contador y bloquea cuenta si pasó del límite.
async function registerFailedAttempt(user) {
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
  if (user.failedLoginAttempts >= MAX_FAILED_BEFORE_LOCK) {
    user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
    user.failedLoginAttempts = 0 // reset contador al bloquear
  }
  try {
    await user.save()
  } catch {}
}
