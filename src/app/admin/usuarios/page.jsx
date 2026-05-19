// Gestión de usuarios (solo admin)
import dbConnect from '@/lib/mongodb'
import User from '@/models/User'
import { getCurrentUser } from '@/lib/auth'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

async function loadUsers() {
  await dbConnect()
  const users = await User.find({})
    .select('_id email name role wholesaleAccess emailVerified lastLoginAt createdAt')
    .sort({ createdAt: -1 })
    .lean()
  return JSON.parse(JSON.stringify(users))
}

export default async function UsuariosPage() {
  const [users, me] = await Promise.all([loadUsers(), getCurrentUser()])
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Usuarios</h1>
        <p className="text-slate-500 text-sm">
          Administra quién puede acceder al panel. Los <b>editores</b> pueden crear y
          editar productos, pero no pueden eliminar ni gestionar usuarios.
        </p>
      </div>
      <UsersClient initialUsers={users} meId={me?.sub || ''} />
    </div>
  )
}
