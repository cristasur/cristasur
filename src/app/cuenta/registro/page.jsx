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
      window.location.href = next
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

        {/* Botón Google */}
        <a
          href="/api/auth/google"
          className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </a>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-xs text-slate-400"><span className="bg-white px-2">o con tu correo</span></div>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
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
