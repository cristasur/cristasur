// /cuenta/nueva-contrasena — Restablecer contraseña con token
'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function NuevaContrasenaForm() {
  const params = useSearchParams()
  const token = params.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(false)
  const [err, setErr] = useState('')

  const input = 'mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500'

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    if (password !== confirm) {
      setErr('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setErr('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(data?.error || 'Ocurrió un error. Intenta de nuevo.')
        return
      }
      setSuccess(true)
    } catch {
      setErr('Ocurrió un error. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
          <p className="text-rose-600 font-semibold">Enlace inválido o expirado.</p>
          <Link href="/cuenta/olvide-contrasena" className="mt-4 inline-block text-brand-700 font-semibold hover:underline text-sm">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
        <h1 className="text-2xl font-black text-slate-900">Nueva contraseña</h1>
        <p className="text-slate-500 text-sm mt-1">Elige una contraseña segura para tu cuenta.</p>

        {success ? (
          <div className="mt-6">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm">
              <p className="font-semibold">¡Contraseña actualizada!</p>
              <p className="mt-1">Ahora puedes iniciar sesión con tu nueva contraseña.</p>
            </div>
            <Link
              href="/cuenta/login"
              className="mt-4 inline-block w-full text-center px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nueva contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Confirmar contraseña</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={input}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Repite tu contraseña"
              />
            </label>

            {err && <p className="text-sm text-rose-600">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60 transition"
            >
              {busy ? 'Guardando…' : 'Guardar contraseña'}
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

export default function NuevaContrasenaPage() {
  return (
    <Suspense>
      <NuevaContrasenaForm />
    </Suspense>
  )
}
