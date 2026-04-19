'use client'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'

export default function LogoutButton() {
  const router = useRouter()
  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }
  return (
    <button
      onClick={onLogout}
      className="flex items-center gap-3 text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 font-medium text-sm"
    >
      <Icon name="logout" className="w-4 h-4" />
      Cerrar sesión
    </button>
  )
}
