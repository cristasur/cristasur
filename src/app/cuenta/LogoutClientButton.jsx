'use client'

export default function LogoutClientButton() {
  async function onClick() {
    await fetch('/api/auth/logout', { method: 'POST' })
    try {
      localStorage.removeItem('cristasur:cart:v1')
    } catch {}
    window.location.href = '/'
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
