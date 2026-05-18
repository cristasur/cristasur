'use client'
import { useEffect, useState } from 'react'

const LS_KEY = 'cristasur:newsletter:dismissed'

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY)) return
    } catch {}
    const t = setTimeout(() => setVisible(true), 8000)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    try { localStorage.setItem(LS_KEY, '1') } catch {}
    setVisible(false)
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.error) {
        setErr(data.error)
        return
      }
      setDone(true)
      try { localStorage.setItem(LS_KEY, '1') } catch {}
      setTimeout(() => setVisible(false), 3000)
    } catch {
      setErr('Algo salió mal. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  if (!visible) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
        onClick={dismiss}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center pointer-events-auto animate-fade-in">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="text-5xl mb-3">🎁</div>
          <h2 className="text-2xl font-black text-slate-900">
            ¡Obtén 5% de descuento!
          </h2>
          <p className="text-slate-600 mt-2 text-sm">
            Suscríbete y recibe ofertas exclusivas al correo
          </p>
          {done ? (
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl text-emerald-700 font-semibold">
              ¡Listo! Revisa tu correo 🎉
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:border-brand-500 text-center"
              />
              {err && <p className="text-sm text-rose-600">{err}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-60 transition-colors"
              >
                {busy ? 'Enviando…' : 'Quiero mi descuento'}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                No gracias
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
