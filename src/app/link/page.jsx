// /link — Tarjeta NFC/QR general (reseña de la Matriz). Solo cambia la reseña de Google.
import LinkTarjeta from '@/components/LinkTarjeta'

export const metadata = {
  title: 'CRISTASUR · Síguenos',
  description: 'Instagram, Facebook, TikTok y reseñas en Google.',
  robots: { index: false, follow: false },
  themeColor: '#faf6f1',
}

export default function Page() {
  return <LinkTarjeta resena="https://g.page/r/CVuA-1drZCfqEAE/review" sucursal="México" />
}
