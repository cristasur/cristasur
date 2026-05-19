'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from './CartProvider'

const LS_GUEST    = 'cristasur:popup:guest:dismissed'
const LS_VERIFY   = 'cristasur:popup:verify:dismissed'

export default function NewsletterPopup() {
  const { user } = useCart()
  const [visible, setVisible] = useState(false)
  const [mode, setMode]       = useState(null) // 'guest' | 'verify'
  const [sent, setSent]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const [ready, setReady]     = useState(false) // evita flash antes de hidratar

  // Espera a que CartProvider hidrate el usuario antes de decidir
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!ready) return

    let newMode = null
    try {
      if (!user) {
        // Visitante sin sesión
        if (!localStorage.getItem(LS_GUEST)) newMode = 'guest'
      } else if (!user.emailVerified) {
        // Sesión activa pero sin verificar
        if (!localStorage.getItem(LS_VERIFY)) newMode = 'verify'
      }
    } catch {}

    if (!newMode) return
    const t = setTimeout(() => {
      setMode(newMode)
      setVisible(true)
    }, 8000)
    return () => clearTimeout(t)
  }, [ready, user])

  function dismiss() {
    try {
      if (mode === 'guest')  localStorage.setItem(LS_GUEST, '1')
      if (mode === 'verify') localStorage.setItem(LS_VERIFY, '1')
    } catch {}
    setVisible(false)
  }

  async function resendVerification() {
    setBusy(true)
    try {
      await fetch('/api/auth/resend-verification', { method: 'POST' })
      setSent(true)
      try { localStorage.setItem(LS_VERIFY, '1') } catch {}
    } catch {}
    finally { setBusy(false) }
  }

  if (!visible || !mode) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={dismiss}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center pointer-events-auto animate-fade-in">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            aria-label="Cerrar"
          >
            ✕
          </button>

          {/* ── Modo: visitante sin cuenta ── */}
          {mode === 'guest' && (
            <>
              <div className="text-5xl mb-3">🎁</div>
              <h2 className="text-2xl font-black text-slate-900">¡Ofertas exclusivas para ti!</h2>
              <p className="text-slate-600 mt-2 text-sm">
                Crea tu cuenta y sé el primero en enterarte de descuentos, nuevos productos y promociones especiales.
              </p>
              <Link
                href="/cuenta/registro"
                onClick={dismiss}
                className="mt-6 block w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/cuenta/login"
                onClick={dismiss}
                className="mt-2 block text-sm text-brand-700 hover:underline"
              >
                Ya tengo cuenta — Iniciar sesión
              </Link>
              <button
                onClick={dismiss}
                className="w-full mt-2 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors"
              >
                No gracias
              </button>
            </>
          )}

          {/* ── Modo: sesión activa pero sin verificar ── */}
          {mode === 'verify' && (
            <>
              <div className="text-5xl mb-3">✉️</div>
              <h2 className="text-2xl font-black text-slate-900">Confirma tu correo</h2>
              <p className="text-slate-600 mt-2 text-sm">
                Verifica tu cuenta para recibir ofertas exclusivas antes que nadie y no perderte ninguna promoción.
              </p>
              {sent ? (
                <div className="mt-6 p-4 bg-emerald-50 rounded-xl text-emerald-700 font-semibold text-sm">
                  ¡Correo enviado! Revisa tu bandeja de entrada 📬
                </div>
              ) : (
                <button
                  onClick={resendVerification}
                  disabled={busy}
                  className="mt-6 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60 transition-colors"
                >
                  {busy ? 'Enviando…' : 'Reenviar correo de verificación'}
                </button>
              )}
              <button
                onClick={dismiss}
                className="w-full mt-2 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors"
              >
                Ahora no
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
