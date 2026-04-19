// ============================================================
// src/middleware.js
// Middleware Edge que protege el panel /admin y las rutas de
// escritura de la API (POST/PUT/DELETE). Verifica la cookie JWT.
// ============================================================
import { NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth'

// Rutas donde NO requerimos auth aunque estén bajo /admin o /api
const PUBLIC_API_WRITE_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  // /api/seed requiere una clave aparte (ver route.js)
])

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const method = request.method

  // ---- Protección del panel admin (páginas) ----
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const payload = await verifyToken(token)
    if (!payload) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ---- Protección de API: escritura requiere auth ----
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (PUBLIC_API_WRITE_PATHS.has(pathname) || pathname === '/api/seed') {
      return NextResponse.next()
    }
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
