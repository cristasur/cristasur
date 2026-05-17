'use client'
import { useRouter } from 'next/navigation'

export default function LogoutClientButton() {
  const router = useRouter()
  async function onClick() {
    await fetch('/api/auth/logout', { method: 'POST' })
    // Limpia el carrito sincronizado para que al volver no quede pegado
    try {
      localStorage.removeItem('cristasur:cart:v1')
    } catch {}
    router.push('/')
    router.refresh()
  }
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
    >
      Salir
    </button>
  )
}
