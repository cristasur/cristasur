// ============================================================
// /admincr — Puerta privada al admin.
// No hay enlaces públicos a esta ruta. Quien la conozca aterriza
// en el login (o directo al dashboard si ya hay sesión).
// Bloqueamos indexación con noindex para que ningún buscador la
// asocie con el sitio.
// ============================================================
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'CRISTASUR',
  robots: { index: false, follow: false, nocache: true },
}

export default async function AdminCrEntry() {
  const user = await getCurrentUser()
  if (user) redirect('/admin')
  redirect('/admin/login')
}
