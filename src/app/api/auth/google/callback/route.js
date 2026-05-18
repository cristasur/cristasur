// ============================================================
// GET /api/auth/google/callback
// Google redirige aquí con un código. Lo intercambiamos por
// un token, obtenemos el perfil y creamos/actualizamos el usuario.
// ============================================================
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { signToken, buildAuthCookie } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cristasur.com'

  // El usuario canceló
  if (error || !code) {
    return NextResponse.redirect(`${siteUrl}/cuenta/login`)
  }

  try {
    // 1. Intercambiar code por access_token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${siteUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenRes.json()
    if (!tokenData.access_token) {
      return NextResponse.redirect(`${siteUrl}/cuenta/login?error=google_token`)
    }

    // 2. Obtener perfil del usuario
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()
    if (!profile.email) {
      return NextResponse.redirect(`${siteUrl}/cuenta/login?error=google_profile`)
    }

    // 3. Buscar o crear usuario en MongoDB
    await dbConnect()
    let user = await User.findOne({ email: profile.email.toLowerCase() })

    if (!user) {
      // Crear nuevo usuario (sin contraseña — solo Google)
      // passwordHash aleatorio: nunca podrá usarse para login normal
      user = await User.create({
        email: profile.email.toLowerCase(),
        name: profile.name || profile.email.split('@')[0],
        role: 'customer',
        passwordHash: crypto.randomBytes(32).toString('hex'),
        wholesaleAccess: false,
      })
    } else {
      // Actualizar nombre si no tenía
      if (!user.name && profile.name) {
        user.name = profile.name
        await user.save()
      }
    }

    // 4. Emitir JWT igual que el login normal
    const token = await signToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      wholesaleAccess: user.wholesaleAccess,
    })

    const cookieOpts = buildAuthCookie(token)
    const res = NextResponse.redirect(`${siteUrl}/cuenta`)

    res.cookies.set(cookieOpts.name, cookieOpts.value, {
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
      maxAge: cookieOpts.maxAge,
    })

    // Limpiar la cookie de state
    res.cookies.delete('oauth_state')

    return res
  } catch (err) {
    console.error('[google/callback]', err)
    return NextResponse.redirect(`${siteUrl}/cuenta/login?error=google_error`)
  }
}
