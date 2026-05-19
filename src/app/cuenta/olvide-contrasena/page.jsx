// /cuenta/olvide-contrasena — Solicitar recuperación de contraseña
'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function OlvideContrasenaPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const input = 'mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500'

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErr(data?.error || 'Ocurrió un error. Intenta de nuevo.')
        return
      }
      setSent(true)
    } catch {
      setErr('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
        <h1 className="text-2xl font-black text-slate-900">¿Olvidaste tu contraseña?</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ingresa tu correo y te enviaremos instrucciones para recuperarla.
        </p>

        {sent ? (
          <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm">
            <p className="font-semibold">¡Correo enviado!</p>
            <p className="mt-1">Te enviamos un correo con instrucciones. Revisa tu bandeja de entrada (y la carpeta de spam).</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                required
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
              />
            </label>

            {err && <p className="text-sm text-rose-600">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60 transition"
            >
              {busy ? 'Enviando…' : 'Enviar instrucciones'}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-slate-600 text-center">
          <Link href="/cuenta/login" className="text-brand-700 font-semibold hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
