/** @type {import('next').NextConfig} */
// Configuración de Next.js para CRISTASUR
const nextConfig = {
  reactStrictMode: true,
  // Permitimos cargar imágenes desde dominios externos comunes (Cloudinary, Unsplash, etc.)
  // y también desde la ruta local /uploads/*
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Cabeceras de seguridad básicas (complementan a middleware)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
