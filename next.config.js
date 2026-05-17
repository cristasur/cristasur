/** @type {import('next').NextConfig} */
// Configuración de Next.js para CRISTASUR.
// La capa de seguridad se compone de:
//  - Middleware (auth/role en /admin y /api de escritura)
//  - Cabeceras de seguridad globales (este archivo)
//  - CSP estricto que mitiga XSS y clickjacking
//  - HSTS en producción (HTTPS forzado un año)

// Política CSP. Mantenemos 'unsafe-inline' en script porque Next.js inyecta
// scripts inline para hidratación; 'unsafe-eval' porque algunas libs lo usan
// en dev. En producción se podría endurecer con nonces, pero para Next 14 con
// App Router este nivel es práctico y sigue protegiendo contra inyecciones.
const isProd = process.env.NODE_ENV === 'production'

const cspDirectives = {
  'default-src': ["'self'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"], // bloquea iframes externos (clickjacking)
  'form-action': ["'self'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'script-src': isProd
    ? ["'self'", "'unsafe-inline'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'connect-src': ["'self'", 'https:', 'wss:'],
  'media-src': ["'self'", 'data:', 'blob:'],
  'worker-src': ["'self'", 'blob:'],
  'manifest-src': ["'self'"],
  // En prod actualizamos requests inseguras a https
  ...(isProd ? { 'upgrade-insecure-requests': [] } : {}),
}

const cspHeader = Object.entries(cspDirectives)
  .map(([k, v]) => (v.length ? `${k} ${v.join(' ')}` : k))
  .join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Content-Security-Policy', value: cspHeader },
  ...(isProd
    ? [
        // HSTS: 1 año, incluye subdominios. Sólo en prod (HTTPS).
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
      ]
    : []),
]

const adminNoindexHeaders = [
  // Cabecera redundante a la metadata noindex de los pages, por si un proxy
  // o crawler ignora <meta>.
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
  { key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // ocultamos "X-Powered-By: Next.js"

  // pdfkit y qrcode son CJS y cargan archivos en runtime; si Next intenta
  // empaquetarlos rompe la generación de PDFs. Los dejamos externos.
  experimental: {
    serverComponentsExternalPackages: ['pdfkit', 'qrcode'],
  },

  // Permitimos cargar imágenes desde dominios externos comunes (Cloudinary, Unsplash, etc.)
  // y también desde la ruta local /uploads/*
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },

  async headers() {
    return [
      // Seguridad global
      { source: '/:path*', headers: securityHeaders },
      // Admin y API: no-indexar y no-cache extra
      { source: '/admin/:path*', headers: adminNoindexHeaders },
      { source: '/admincr/:path*', headers: adminNoindexHeaders },
      { source: '/admincr', headers: adminNoindexHeaders },
      { source: '/api/:path*', headers: adminNoindexHeaders },
    ]
  },
}

module.exports = nextConfig
