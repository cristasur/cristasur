// /cuenta/login — Login de clientes (separado de /admin/login)
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CustomerLoginPage() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/cuenta'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data?.error || 'Credenciales inválidas')
        return
      }
      // Si por error iniciara un admin desde aquí, lo enviamos al admin
      if (data?.user?.role === 'admin' || data?.user?.role === 'editor') {
        router.push('/admin')
      } else {
        router.push(next)
      }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const input = 'mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500'

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
        <h1 className="text-2xl font-black text-slate-900">Inicia sesión</h1>
        <p className="text-slate-500 text-sm mt-1">
          Para recuperar tu carrito y ver tus pedidos.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
              required
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              required
              autoComplete="current-password"
            />
          </label>

          {err && <p className="text-sm text-rose-600">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60"
          >
            {busy ? 'Ingresando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600 text-center">
          ¿No tienes cuenta?{' '}
          <Link href={`/cuenta/registro?next=${encodeURIComponent(next)}`} className="text-brand-700 font-semibold hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
