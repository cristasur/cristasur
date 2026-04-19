// ============================================================
// Layout raíz - incluye Navbar y Footer en todas las páginas
// Usa fuente del sistema + Tailwind para estilo moderno
// ============================================================
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'CRISTASUR — Plásticos y artículos para hogar y negocio',
  description:
    'Plásticos, mesas, sillas, juguetes, artículos para restaurantes y desechables. Precios económicos, calidad garantizada.',
  keywords: ['cristasur', 'plásticos', 'hogar', 'restaurante', 'mayoreo', 'mesas', 'sillas'],
  openGraph: {
    title: 'CRISTASUR',
    description: 'Plásticos y artículos económicos para hogar y negocio.',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
