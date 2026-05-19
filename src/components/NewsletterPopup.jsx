'use client'
import { useEffect, useState } from 'react'
import { useCart } from './CartProvider'

const LS_NEVER   = 'cristasur:offers:never'     // "No volver a mostrar"
const LS_FIRST   = 'cristasur:offers:first-seen' // timestamp del primer login
const SS_SEEN    = 'cristasur:offers:session'    // "Ahora no" — solo esta sesión

const DELAY_MS   = 30_000  // 30 segundos
const MIN_AGE_MS = 24 * 60 * 60 * 1000 // 24 horas desde primer login

export default function NewsletterPopup() {
  const { user } = useCart()
  const [visible, setVisible] = useState(false)
  const [done, setDone]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const [ready, setReady]     = useState(false)

  // Espera a que CartProvider hidrate
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!ready) return
    // Solo para usuarios verificados y no suscritos
    if (!user || !user.emailVerified || user.newsletterSubscribed) return

    try {
      // Nunca mostrar si el usuario eligió "No volver a mostrar"
      if (localStorage.getItem(LS_NEVER)) return
      // No mostrar esta sesión si eligió "Ahora no"
      if (sessionStorage.getItem(SS_SEEN)) return

      // Registrar la primera vez que vemos al usuario logueado
      if (!localStorage.getItem(LS_FIRST)) {
        localStorage.setItem(LS_FIRST, String(Date.now()))
        return // No mostrar en la primera sesión
      }

      // Solo mostrar si ya pasaron 24 horas del primer login
      const firstSeen = Number(localStorage.getItem(LS_FIRST)) || Date.now()
      if (Date.now() - firstSeen < MIN_AGE_MS) return

    } catch { return }

    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [ready, user])

  async function subscribe() {
    setBusy(true)
    try {
      await fetch('/api/auth/subscribe-offers', { method: 'POST' })
      setDone(true)
      try { localStorage.setItem(LS_NEVER, '1') } catch {}
      setTimeout(() => setVisible(false), 3000)
    } catch {} finally { setBusy(false) }
  }

  function laterSession() {
    try { sessionStorage.setItem(SS_SEEN, '1') } catch {}
    setVisible(false)
  }

  function neverAgain() {
    try { localStorage.setItem(LS_NEVER, '1') } catch {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={laterSession} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center pointer-events-auto animate-fade-in">
          <button
            onClick={laterSession}
            className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-400"
            aria-label="Cerrar"
          >✕</button>

          <div className="text-5xl mb-3">🎁</div>
          <h2 className="text-2xl font-black text-slate-900">¿Quieres recibir ofertas?</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Entérate antes que nadie de descuentos, promociones y nuevos productos de CRISTASUR.
          </p>

          {done ? (
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl text-emerald-700 font-semibold text-sm">
              ¡Listo! Te avisaremos de las mejores ofertas 🎉
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <button
                onClick={subscribe}
                disabled={busy}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60 transition-colors"
              >
                {busy ? 'Guardando…' : 'Sí, quiero ofertas'}
              </button>
              <button
                onClick={laterSession}
                className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors"
              >
                Ahora no
              </button>
              <button
                onClick={neverAgain}
                className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                No volver a mostrar
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
