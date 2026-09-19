'use client'
// /admin/login - formulario de acceso con soporte 2FA
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [backupCode, setBackupCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [needsTotp, setNeedsTotp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { email, password }
      if (needsTotp) {
        if (useBackup) payload.backupCode = backupCode
        else payload.totpCode = totpCode
      }
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      // Si necesita 2FA, mostramos el paso siguiente sin cambiar de página
      if (data?.needsTotp) {
        setNeedsTotp(true)
        setError('')
        return
      }
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

  function goBackToPassword() {
    setNeedsTotp(false)
    setTotpCode('')
    setBackupCode('')
    setUseBackup(false)
    setError('')
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
          <p className="mt-3 text-slate-500 text-sm">
            {needsTotp ? 'Verificación en dos pasos' : 'Inicia sesión para administrar'}
          </p>
        </div>

        {!needsTotp && (
          <>
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
          </>
        )}

        {needsTotp && !useBackup && (
          <>
            <div className="mb-5 text-sm text-slate-600">
              Ingresa el código de 6 dígitos de tu app autenticadora
              (Google Authenticator, Authy, etc.).
            </div>
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-700">Código de verificación</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                autoFocus
                required
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 w-full px-3 py-3 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-center font-mono text-2xl tracking-widest"
                placeholder="000000"
              />
            </label>
            <button
              type="button"
              onClick={() => setUseBackup(true)}
              className="mb-4 text-xs text-brand-700 hover:text-brand-900 underline underline-offset-2"
            >
              ¿No tienes tu celular? Usa un código de respaldo
            </button>
          </>
        )}

        {needsTotp && useBackup && (
          <>
            <div className="mb-5 text-sm text-slate-600">
              Ingresa uno de los códigos de respaldo que guardaste al activar 2FA.
              Formato: <code className="bg-slate-100 px-1 rounded">XXXX-XXXXXXXX</code>
            </div>
            <label className="block mb-4">
              <span className="text-sm font-medium text-slate-700">Código de respaldo</span>
              <input
                type="text"
                autoComplete="off"
                autoFocus
                required
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                className="mt-1 w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-center font-mono tracking-widest"
                placeholder="XXXX-XXXXXXXX"
              />
            </label>
            <button
              type="button"
              onClick={() => setUseBackup(false)}
              className="mb-4 text-xs text-brand-700 hover:text-brand-900 underline underline-offset-2"
            >
              Volver a usar código de la app
            </button>
          </>
        )}

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
          {loading ? 'Entrando...' : needsTotp ? 'Verificar' : 'Entrar'}
        </button>

        {needsTotp && (
          <button
            type="button"
            onClick={goBackToPassword}
            className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-700"
          >
            ← Cambiar cuenta
          </button>
        )}
      </form>
    </div>
  )
}
