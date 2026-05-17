// ============================================================
// /robots.txt
// Bloquea explícitamente todas las rutas administrativas y de
// API para que no aparezcan indexadas en Google ni en archivos
// públicos. Las páginas igualmente envían noindex en metadata.
// ============================================================
export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: [
          '/admin',
          '/admin/',
          '/admincr',
          '/admincr/',
          '/api/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
