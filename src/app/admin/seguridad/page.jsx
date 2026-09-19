// /admin/seguridad — Gestión de 2FA para el usuario actual
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SecurityClient from './SecurityClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Seguridad · CRISTASUR Admin', robots: { index: false } }

async function loadUser() {
  const session = await getCurrentUser()
  if (!session) return null
  await dbConnect()
  const user = await User.findById(session.sub)
    .select('email name role totpEnabled failedLoginAttempts lockedUntil')
    .lean()
  return user ? JSON.parse(JSON.stringify(user)) : null
}

export default async function SecurityPage() {
  const user = await loadUser()
  if (!user) redirect('/admin/login?next=/admin/seguridad')
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Seguridad de tu cuenta</h1>
        <p className="text-slate-500 text-sm">
          Añade una segunda capa de protección con verificación en dos pasos (2FA).
        </p>
      </div>
      <SecurityClient user={user} />
    </div>
  )
}
