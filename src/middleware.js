// ============================================================
// src/middleware.js
// Middleware Edge que protege el panel /admin y las rutas de
// escritura de la API (POST/PUT/DELETE). Verifica la cookie JWT
// y aplica restricciones por rol (editor vs admin).
//
// Capa de defensa adicional:
//  - Origin / Referer matching para mitigar CSRF (cookies SameSite=lax
//    ya cubren la mayoría, pero esta capa cierra el resto).
// ============================================================
import { NextResponse } from 'next/server'
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth'

// Rutas donde NO requerimos auth aunque estén bajo /admin o /api
const PUBLIC_API_WRITE_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register', // crear cuenta de cliente (público)
  '/api/reviews', // crear reseña pública (POST); el GET también es público
  '/api/coupons/apply', // preview de cupón (no mutación de BD)
  // /api/seed requiere una clave aparte (ver route.js) y está bloqueado en prod
])

// Para endpoints con parámetros dinámicos: patrones regex que permiten
// ciertas combinaciones path+método sin auth.
const PUBLIC_WRITE_PATTERNS = [
  // PATCH /api/products/:id?action=view|whatsapp  (métricas públicas)
  {
    method: 'PATCH',
    test: (pathname, url) => {
      if (!/^\/api\/products\/[a-f0-9]{24}$/i.test(pathname)) return false
      const action = url.searchParams.get('action')
      return action === 'view' || action === 'whatsapp'
    },
  },
  // POST /api/orders → crear order intent desde el carrito (público)
  {
    method: 'POST',
    test: (pathname) => pathname === '/api/orders',
  },
]

// Rutas que SÓLO el admin puede usar (editor no puede)
const ADMIN_ONLY_PATTERNS = [
  // /api/users/* : gestión de cuentas
  { test: (pathname) => pathname.startsWith('/api/users') },
  // Borrado duro de productos (?hard=1)
  {
    method: 'DELETE',
    test: (pathname, url) =>
      /^\/api\/products\/[a-f0-9]{24}$/i.test(pathname) &&
      url.searchParams.get('hard') === '1',
  },
]

const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

// Verifica que Origin/Referer del request apunten al mismo host. Si no lo hacen,
// es probablemente CSRF desde otro sitio.
function isSameOrigin(request) {
  const host = request.headers.get('host')
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  // Si el browser no envía origin ni referer (raro), dejamos pasar — el JWT
  // y el rate limit siguen siendo barreras.
  if (!origin && !referer) return true

  try {
    if (origin) {
      const o = new URL(origin)
      return o.host === host
    }
    if (referer) {
      const r = new URL(referer)
      return r.host === host
    }
  } catch {
    return false
  }
  return false
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl
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
    // Customer NUNCA entra al admin, sólo admin/editor
    if (payload.role !== 'admin' && payload.role !== 'editor') {
      return NextResponse.redirect(new URL('/cuenta', request.url))
    }
    // Admin-only pages: /admin/usuarios
    if (pathname.startsWith('/admin/usuarios') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // ---- Protección de /cuenta y /mayoreo (clientes logueados) ----
  if (pathname.startsWith('/cuenta') && !pathname.startsWith('/cuenta/login') && !pathname.startsWith('/cuenta/registro')) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const payload = await verifyToken(token)
    if (!payload) {
      const loginUrl = new URL('/cuenta/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  if (pathname.startsWith('/mayoreo')) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/cuenta/login?next=/mayoreo', request.url))
    }
    // Sólo clientes con wholesaleAccess o admin pueden ver /mayoreo
    if (!payload.wholesaleAccess && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/cuenta?no-mayoreo=1', request.url))
    }
  }

  // ---- Protección de API: escritura ----
  if (pathname.startsWith('/api/') && STATE_CHANGING.has(method)) {
    // Defensa CSRF: rechazamos requests state-changing cuyo Origin/Referer
    // no apunten a nuestro propio host.
    if (!isSameOrigin(request)) {
      return NextResponse.json(
        { error: 'Origen no autorizado' },
        { status: 403 }
      )
    }

    // Whitelist directo (login/logout/reviews/coupons-apply)
    if (PUBLIC_API_WRITE_PATHS.has(pathname) || pathname === '/api/seed') {
      return NextResponse.next()
    }
    // Whitelist por patrón (view/whatsapp tracking)
    const isPublicPattern = PUBLIC_WRITE_PATTERNS.some(
      (p) => p.method === method && p.test(pathname, url)
    )
    if (isPublicPattern) return NextResponse.next()

    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Restricciones de rol
    const isAdminOnly = ADMIN_ONLY_PATTERNS.some((p) => {
      if (p.method && p.method !== method) return false
      return p.test(pathname, url)
    })
    if (isAdminOnly && payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acción sólo permitida para administradores' },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
