// ============================================================
// src/lib/auth.js
// Utilidades de autenticación con JWT usando `jose` (Edge-friendly).
// - signToken / verifyToken: emisión y verificación
// - getUserFromRequest: extrae el usuario actual de la cookie
// - requireAdmin: helper para proteger rutas API
// ============================================================
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'cristasur_token'
const TOKEN_TTL = '7d'     // 7 días
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

function getSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres (ver .env.example)')
  }
  return new TextEncoder().encode(secret)
}

// Emite un JWT con el id y rol del usuario
export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .setIssuer('cristasur')
    .sign(getSecret())
}

// Verifica y devuelve el payload o null si es inválido
export async function verifyToken(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'cristasur',
    })
    return payload
  } catch {
    return null
  }
}

// Extrae el usuario actual desde la cookie (server components / route handlers)
export async function getCurrentUser() {
  const token = cookies().get(COOKIE_NAME)?.value
  return verifyToken(token)
}

// Devuelve la configuración de cookie segura (usar en login/logout)
export function buildAuthCookie(token) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,      // no accesible vía JS - mitiga XSS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',     // protege contra la mayor parte de CSRF
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  }
}

export function buildLogoutCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME
