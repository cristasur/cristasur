// ============================================================
// Layout raíz - incluye Navbar, Footer y FAB de WhatsApp en todas las páginas
// Inyecta también JSON-LD Organization + LocalBusiness para SEO local.
// ============================================================
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import CartProvider from '@/components/CartProvider'
import CartDrawer from '@/components/CartDrawer'
import WhatsAppFab from '@/components/WhatsAppFab'
import { LOCATIONS } from '@/lib/locations'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    google: 'DdA3MOprrb-X0HZ_4Kspj6uYSnffdKE6X5NibDdA4w8',
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  title: 'CRISTASUR — Plásticos y artículos para hogar y negocio',
  description:
    'CRISTASUR Mérida — Artículos para hogar, restaurante y negocio. Los mejores precios en mayoreo y menudeo. Sucursales en Yucatán y Bacalar. Envíos nacionales.',
  keywords: [
    'cristasur',
    'plásticos',
    'hogar',
    'restaurante',
    'mayoreo',
    'mesas',
    'sillas',
    'mérida',
    'bacalar',
    'yucatán',
    'quintana roo',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'CRISTASUR',
    description: 'Plásticos y artículos económicos para hogar y negocio.',
    type: 'website',
    siteName: 'CRISTASUR',
    locale: 'es_MX',
    images: [{ url: '/logo.png', width: 1000, height: 350, alt: 'CRISTASUR Mérida' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CRISTASUR',
    description: 'Plásticos y artículos económicos para hogar y negocio.',
    images: ['/logo.png'],
  },
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CRISTASUR',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: ['https://www.instagram.com/cristasurmx/'],
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+529994731919',
      contactType: 'sales',
      areaServed: ['MX'],
      availableLanguage: ['Spanish'],
    },
  ],
}

const localBusinessJsonLd = LOCATIONS.map((l) => ({
  '@context': 'https://schema.org',
  '@type': 'Store',
  '@id': `${SITE_URL}/#${l.id}`,
  name: l.name,
  image: `${SITE_URL}/logo.png`,
  telephone: l.phone,
  address: {
    '@type': 'PostalAddress',
    streetAddress: l.address,
    addressLocality: l.city,
    addressRegion: l.state,
    addressCountry: l.country,
  },
  geo: { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng },
  url: l.mapsUrl,
  openingHours: l.hours,
}))

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-CG871WYQHV" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-CG871WYQHV');`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppFab />
        </CartProvider>
      </body>
    </html>
  )
}
