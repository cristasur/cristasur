// /cuenta/registro — Crear cuenta de cliente
'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterForm() {
  const router = useRouter()
  const search = useSearchParams()
  const next = search.get('next') || '/cuenta'
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', accept: false })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    if (!form.accept) {
      setErr('Necesitas aceptar el aviso de privacidad')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data?.error || 'Error al crear cuenta')
        return
      }
      router.push(next)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const input = 'mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500'

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
        <h1 className="text-2xl font-black text-slate-900">Crea tu cuenta</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tu carrito se guarda entre sesiones y dispositivos. Sin spam.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nombre</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={input}
              required
              minLength={2}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={input}
              required
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">WhatsApp (opcional)</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={input}
              placeholder="999 123 4567"
              autoComplete="tel"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contraseña</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={input}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <span className="text-xs text-slate-500">Mínimo 8 caracteres.</span>
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.accept}
              onChange={(e) => setForm({ ...form, accept: e.target.checked })}
              className="mt-1"
            />
            <span className="text-slate-600">
              Acepto el{' '}
              <Link href="/aviso-de-privacidad" className="text-brand-700 underline">
                aviso de privacidad
              </Link>{' '}
              y los{' '}
              <Link href="/terminos" className="text-brand-700 underline">
                términos
              </Link>
              .
            </span>
          </label>

          {err && <p className="text-sm text-rose-600">{err}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60"
          >
            {busy ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-4 text-sm text-slate-600 text-center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/cuenta/login" className="text-brand-700 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
