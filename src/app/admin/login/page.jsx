'use client'
// /admin/login - formulario de acceso
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }
      const safeNext = next?.startsWith('/') ? next : '/admin'
      router.push(safeNext)
      router.refresh()
    } catch (err) {
      setError('No se pudo conectar al servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] grid place-items-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-card border border-slate-100"
      >
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="CRISTASUR Mérida"
            className="h-32 w-auto object-contain mx-auto"
          />
          <p className="mt-3 text-slate-500 text-sm">Inicia sesión para administrar</p>
        </div>

        <label className="block mb-3">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </label>

        <label className="block mb-5">
          <span className="text-sm font-medium text-slate-700">Contraseña</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </label>

        {error && (
          <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
