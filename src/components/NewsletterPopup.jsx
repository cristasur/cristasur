'use client'
// ============================================================
// src/components/NewsletterPopup.jsx
// Popup inteligente con 3 estados según el tipo de usuario:
//
//  1. Guest (sin cuenta)       → segunda visita en día diferente
//  2. Sin verificar            → a los 10 s tras login
//  3. Verificado / no suscrito → a los 30 s, solo después de 24 h
// ============================================================
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCart } from './CartProvider'

// ---- localStorage / sessionStorage keys ----
const LS_GUEST_NEVER     = 'cristasur:popup:guest:never'
const LS_GUEST_FIRST_DAY = 'cristasur:popup:guest:firstDay'
const SS_GUEST_SEEN      = 'cristasur:popup:guest:session'

const SS_VERIFY_SEEN     = 'cristasur:popup:verify:session'

const LS_OFFERS_NEVER    = 'cristasur:offers:never'
const LS_OFFERS_FIRST    = 'cristasur:offers:first-seen'
const SS_OFFERS_SEEN     = 'cristasur:offers:session'

// ---- Tiempos ----
const GUEST_DELAY_MS     = 20_000               // 20 s en segunda visita
const VERIFY_DELAY_MS    = 10_000               // 10 s tras login sin verificar
const OFFERS_DELAY_MS    = 30_000               // 30 s para el popup de ofertas
const OFFERS_MIN_AGE_MS  = 24 * 60 * 60 * 1000 // 24 h desde primer login verificado

function todayStr() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

// ---- Wrapper modal compartido ----
function PopupModal({ onBackdropClick, children }) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onBackdropClick}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center pointer-events-auto animate-fade-in">
          {children}
        </div>
      </div>
    </>
  )
}

// ============================================================
// Estado 1 — Visitante sin cuenta
// ============================================================
function GuestPopup({ onClose }) {
  function later() {
    try { sessionStorage.setItem(SS_GUEST_SEEN, '1') } catch {}
    onClose()
  }
  function never() {
    try { localStorage.setItem(LS_GUEST_NEVER, '1') } catch {}
    onClose()
  }

  return (
    <PopupModal onBackdropClick={later}>
      <button
        onClick={later}
        className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-400"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div className="text-5xl mb-3">🛍️</div>
      <h2 className="text-2xl font-black text-slate-900">
        Crea tu cuenta — es gratis
      </h2>
      <p className="text-slate-500 mt-2 text-sm">
        Guarda tu carrito entre sesiones, revisa tu historial de pedidos
        y accede a precios exclusivos para clientes de CRISTASUR.
      </p>

      <div className="mt-6 space-y-2">
        <Link
          href="/cuenta/registro"
          onClick={never}
          className="block w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors"
        >
          Crear cuenta gratis
        </Link>
        <Link
          href="/cuenta/login"
          onClick={never}
          className="block w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors"
        >
          Ya tengo una cuenta
        </Link>
        <button
          onClick={later}
          className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Ahora no
        </button>
        <button
          onClick={never}
          className="w-full py-1.5 text-xs text-slate-300 hover:text-slate-500 transition-colors"
        >
          No volver a mostrar
        </button>
      </div>
    </PopupModal>
  )
}

// ============================================================
// Estado 2 — Cuenta sin verificar
// ============================================================
function VerifyPopup({ onClose }) {
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [checking, setChecking] = useState(false)
  const [msg, setMsg]           = useState('')

  function later() {
    try { sessionStorage.setItem(SS_VERIFY_SEEN, '1') } catch {}
    onClose()
  }

  async function resend() {
    setSending(true)
    setMsg('')
    try {
      await fetch('/api/auth/resend-verification', { method: 'POST' })
      setSent(true)
    } catch {
      setMsg('No pudimos enviar el correo. Intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  async function checkVerified() {
    setChecking(true)
    setMsg('')
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' })
      const j = await r.json()
      if (j?.user?.emailVerified) {
        setMsg('✅ ¡Correo verificado! Tu cuenta está completa.')
        setTimeout(() => onClose(), 2500)
      } else {
        setMsg('Aún no está verificado. Revisa tu bandeja y la carpeta de spam.')
      }
    } catch {
      setMsg('No pudimos conectar. Intenta de nuevo.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <PopupModal onBackdropClick={later}>
      <button
        onClick={later}
        className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-400"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div className="text-5xl mb-3">📧</div>
      <h2 className="text-2xl font-black text-slate-900">Verifica tu correo</h2>
      <p className="text-slate-500 mt-2 text-sm">
        Completa tu cuenta para consultar tu historial de pedidos,
        recuperar tu contraseña y recibir confirmaciones de compra.
      </p>

      {sent ? (
        <div className="mt-6 p-4 bg-emerald-50 rounded-xl text-emerald-700 font-semibold text-sm">
          ✉️ Te reenviamos el correo. Revisa tu bandeja de entrada
          y la carpeta de spam.
        </div>
      ) : (
        <button
          onClick={resend}
          disabled={sending}
          className="mt-6 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60 transition-colors"
        >
          {sending ? 'Enviando…' : 'Reenviar verificación'}
        </button>
      )}

      {msg && (
        <p
          className={`mt-3 text-sm font-medium ${
            msg.startsWith('✅') ? 'text-emerald-600' : 'text-amber-600'
          }`}
        >
          {msg}
        </p>
      )}

      <div className="mt-3 space-y-1">
        <button
          onClick={checkVerified}
          disabled={checking}
          className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {checking ? 'Verificando…' : 'Ya lo verifiqué'}
        </button>
        <button
          onClick={later}
          className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Después
        </button>
      </div>
    </PopupModal>
  )
}

// ============================================================
// Estado 3 — Verificado, aún no suscrito a ofertas
// ============================================================
function OffersPopup({ onClose }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function subscribe() {
    setBusy(true)
    try {
      await fetch('/api/auth/subscribe-offers', { method: 'POST' })
      setDone(true)
      try { localStorage.setItem(LS_OFFERS_NEVER, '1') } catch {}
      setTimeout(() => onClose(), 3000)
    } catch {} finally {
      setBusy(false)
    }
  }

  function later() {
    try { sessionStorage.setItem(SS_OFFERS_SEEN, '1') } catch {}
    onClose()
  }

  function never() {
    try { localStorage.setItem(LS_OFFERS_NEVER, '1') } catch {}
    onClose()
  }

  return (
    <PopupModal onBackdropClick={later}>
      <button
        onClick={later}
        className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-400"
        aria-label="Cerrar"
      >
        ✕
      </button>

      <div className="text-5xl mb-3">🎁</div>
      <h2 className="text-2xl font-black text-slate-900">¿Quieres recibir ofertas?</h2>
      <p className="text-slate-500 mt-2 text-sm">
        Entérate antes que nadie de descuentos, promociones y nuevos
        productos de CRISTASUR.
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
            onClick={later}
            className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-600 font-semibold text-sm transition-colors"
          >
            Ahora no
          </button>
          <button
            onClick={never}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            No volver a mostrar
          </button>
        </div>
      )}
    </PopupModal>
  )
}

// ============================================================
// Controlador principal — decide qué popup mostrar
// ============================================================
export default function NewsletterPopup() {
  const { user } = useCart()
  const [ready, setReady] = useState(false)
  const [which, setWhich] = useState(null) // 'guest' | 'verify' | 'offers' | null

  // Espera a que CartProvider hidrate (~700 ms)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 700)
    return () => clearTimeout(t)
  }, [])

  // Bloquea el scroll del body mientras hay un popup abierto
  useEffect(() => {
    if (!which) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [which])

  useEffect(() => {
    if (!ready) return
    let timer

    // ---- Prioridad 1: cuenta sin verificar ----
    if (user && !user.emailVerified) {
      try { if (sessionStorage.getItem(SS_VERIFY_SEEN)) return } catch {}
      timer = setTimeout(() => setWhich('verify'), VERIFY_DELAY_MS)
      return () => clearTimeout(timer)
    }

    // ---- Prioridad 2: verificado pero no suscrito ----
    if (user && user.emailVerified && !user.newsletterSubscribed) {
      try {
        if (localStorage.getItem(LS_OFFERS_NEVER)) return
        if (sessionStorage.getItem(SS_OFFERS_SEEN)) return
        // Registrar primera sesión verificada
        if (!localStorage.getItem(LS_OFFERS_FIRST)) {
          localStorage.setItem(LS_OFFERS_FIRST, String(Date.now()))
          return // no mostrar en la primera sesión verificada
        }
        const firstSeen = Number(localStorage.getItem(LS_OFFERS_FIRST)) || Date.now()
        if (Date.now() - firstSeen < OFFERS_MIN_AGE_MS) return
      } catch { return }
      timer = setTimeout(() => setWhich('offers'), OFFERS_DELAY_MS)
      return () => clearTimeout(timer)
    }

    // ---- Prioridad 3: visitante sin cuenta ----
    if (!user) {
      try {
        if (localStorage.getItem(LS_GUEST_NEVER)) return
        if (sessionStorage.getItem(SS_GUEST_SEEN)) return
        const today = todayStr()
        const firstDay = localStorage.getItem(LS_GUEST_FIRST_DAY)
        if (!firstDay) {
          // Primera visita: registrar y no mostrar
          localStorage.setItem(LS_GUEST_FIRST_DAY, today)
          return
        }
        if (firstDay === today) return // mismo día que la primera visita
        // Segunda visita en día diferente → mostrar popup
      } catch { return }
      timer = setTimeout(() => setWhich('guest'), GUEST_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [ready, user])

  function close() { setWhich(null) }

  if (!which) return null
  if (which === 'guest')  return <GuestPopup  onClose={close} />
  if (which === 'verify') return <VerifyPopup onClose={close} />
  if (which === 'offers') return <OffersPopup onClose={close} />
  return null
}
