'use client'
// ============================================================
// SecurityClient — UI para activar/desactivar 2FA.
// Flujo activar: setup → QR + secret → user escanea → user escribe
//   código → /enable → se muestran códigos de respaldo.
// Flujo desactivar: pedir contraseña → /disable.
// ============================================================
import { useState } from 'react'

export default function SecurityClient({ user }) {
  const [state, setState] = useState({
    // 'idle' | 'setup' | 'confirming' | 'showBackup' | 'disabling'
    step: 'idle',
    totpEnabled: !!user.totpEnabled,
    qrDataUrl: null,
    secret: null,
    code: '',
    backupCodes: null,
    password: '',
    error: '',
    loading: false,
  })

  function set(patch) {
    setState((s) => ({ ...s, ...patch }))
  }

  async function startSetup() {
    set({ loading: true, error: '' })
    try {
      const r = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        credentials: 'include',
      })
      const j = await r.json()
      if (!r.ok) {
        set({ error: j?.error || 'Error al iniciar 2FA', loading: false })
        return
      }
      set({
        step: 'setup',
        qrDataUrl: j.qrDataUrl,
        secret: j.secret,
        loading: false,
        error: '',
      })
    } catch (e) {
      set({ error: 'Error de red', loading: false })
    }
  }

  async function confirmCode(e) {
    e.preventDefault()
    set({ loading: true, error: '' })
    try {
      const r = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: state.code }),
      })
      const j = await r.json()
      if (!r.ok) {
        set({ error: j?.error || 'Código inválido', loading: false })
        return
      }
      set({
        step: 'showBackup',
        backupCodes: j.backupCodes,
        totpEnabled: true,
        code: '',
        loading: false,
      })
    } catch (e) {
      set({ error: 'Error de red', loading: false })
    }
  }

  async function disable2FA(e) {
    e.preventDefault()
    set({ loading: true, error: '' })
    try {
      const r = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: state.password }),
      })
      const j = await r.json()
      if (!r.ok) {
        set({ error: j?.error || 'No se pudo desactivar', loading: false })
        return
      }
      set({
        step: 'idle',
        totpEnabled: false,
        password: '',
        loading: false,
        error: '',
      })
    } catch (e) {
      set({ error: 'Error de red', loading: false })
    }
  }

  // ── Render ──
  return (
    <div className="max-w-2xl space-y-6">
      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 grid place-items-center text-brand-700 shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-black text-slate-900">Verificación en dos pasos (2FA)</h2>
              {state.totpEnabled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ✓ Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  Inactivo
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Al iniciar sesión, además de tu contraseña te pediremos un código de 6 dígitos
              generado por una app en tu celular (Google Authenticator, Authy, 1Password, etc.).
            </p>
          </div>
        </div>

        {state.error && (
          <div className="mt-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {state.error}
          </div>
        )}

        {/* ── Estado: inactivo → botón activar ── */}
        {!state.totpEnabled && state.step === 'idle' && (
          <div className="mt-5 flex gap-3">
            <button
              onClick={startSetup}
              disabled={state.loading}
              className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-60"
            >
              {state.loading ? 'Preparando…' : 'Activar 2FA'}
            </button>
          </div>
        )}

        {/* ── Estado: setup → mostrar QR + input código ── */}
        {state.step === 'setup' && (
          <div className="mt-5 space-y-4">
            <ol className="text-sm text-slate-700 list-decimal pl-5 space-y-1">
              <li>Instala <b>Google Authenticator</b>, <b>Authy</b>, <b>1Password</b> o similar en tu celular.</li>
              <li>Escanea el código QR desde la app.</li>
              <li>Ingresa el código de 6 dígitos que te muestre.</li>
            </ol>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.qrDataUrl} alt="QR 2FA" className="w-48 h-48 block" />
              </div>
              <div className="text-xs text-slate-500 space-y-2">
                <p>Si no puedes escanear, ingresa manualmente esta clave en tu app:</p>
                <code className="block bg-slate-50 border border-slate-200 rounded px-3 py-2 font-mono text-slate-800 break-all">
                  {state.secret}
                </code>
              </div>
            </div>

            <form onSubmit={confirmCode} className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Código de verificación</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  autoComplete="one-time-code"
                  value={state.code}
                  onChange={(e) => set({ code: e.target.value.replace(/\D/g, '') })}
                  className="mt-1 w-40 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-center font-mono text-lg tracking-widest"
                  placeholder="000000"
                  required
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={state.loading || state.code.length !== 6}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm disabled:opacity-60"
                >
                  {state.loading ? 'Verificando…' : 'Confirmar y activar'}
                </button>
                <button
                  type="button"
                  onClick={() => set({ step: 'idle', qrDataUrl: null, secret: null, code: '' })}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Estado: mostrar códigos de respaldo ── */}
        {state.step === 'showBackup' && Array.isArray(state.backupCodes) && (
          <div className="mt-5 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="font-bold text-amber-900 text-sm">
                ⚠️ Guarda estos códigos ahora — no se volverán a mostrar
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Si pierdes tu celular, usa uno de estos códigos para entrar. Cada uno funciona
                UNA vez. Guárdalos en un manager de contraseñas o imprímelos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl p-4">
              {state.backupCodes.map((c) => (
                <div key={c} className="text-slate-800">{c}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const txt = state.backupCodes.join('\n')
                  navigator.clipboard?.writeText(txt)
                  alert('Códigos copiados al portapapeles')
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold"
              >
                Copiar todos
              </button>
              <button
                onClick={() => set({ step: 'idle', backupCodes: null })}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold"
              >
                Listo, ya los guardé
              </button>
            </div>
          </div>
        )}

        {/* ── Estado: activo → botón desactivar ── */}
        {state.totpEnabled && state.step === 'idle' && (
          <div className="mt-5">
            <button
              onClick={() => set({ step: 'disabling', password: '', error: '' })}
              className="text-sm text-rose-700 hover:text-rose-900 underline underline-offset-2 font-semibold"
            >
              Desactivar 2FA
            </button>
          </div>
        )}

        {/* ── Estado: pidiendo contraseña para desactivar ── */}
        {state.step === 'disabling' && (
          <form onSubmit={disable2FA} className="mt-5 space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Confirma tu contraseña para desactivar 2FA
              </span>
              <input
                type="password"
                value={state.password}
                onChange={(e) => set({ password: e.target.value })}
                className="mt-1 w-full max-w-xs px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                required
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={state.loading || !state.password}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm disabled:opacity-60"
              >
                {state.loading ? 'Desactivando…' : 'Sí, desactivar'}
              </button>
              <button
                type="button"
                onClick={() => set({ step: 'idle', password: '', error: '' })}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
        <h2 className="font-black text-slate-900 mb-3">Protecciones automáticas</h2>
        <ul className="text-sm text-slate-600 space-y-2">
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><b>Lockout automático:</b> tras 5 intentos fallidos, tu cuenta se bloquea 15 minutos.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><b>Rate limit por IP:</b> máximo 10 intentos de login por IP cada 15 minutos.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><b>Cookies seguras:</b> httpOnly + sameSite=lax + protección CSRF por Origin.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-600">✓</span>
            <span><b>Contraseñas hasheadas:</b> bcrypt con 12 rounds, nunca en texto plano.</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
