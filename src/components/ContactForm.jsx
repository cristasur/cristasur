'use client'
// ============================================================
// Formulario "Envíanos un mensaje" de /contacto.
// Manda a /api/contacto (se guarda y llega por correo a la tienda).
// ============================================================
import { useState } from 'react'

const MOTIVOS = [
  'Cotización o mayoreo',
  'Estado de mi pedido',
  'Disponibilidad de un producto',
  'Facturación',
  'Cambios y devoluciones',
  'Venta a restaurante o negocio',
  'Otro',
]

const I = {
  user: <path d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  mail: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />,
}
const Ico = ({ n, className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[n]}</svg>
)

const campo = 'w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

export default function ContactForm() {
  const [f, setF] = useState({ nombre: '', correo: '', telefono: '', motivo: '', mensaje: '', empresa: '' })
  const [estado, setEstado] = useState('') // '' | enviando | ok
  const [error, setError] = useState('')
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  async function enviar(e) {
    e.preventDefault()
    setError('')
    setEstado('enviando')
    try {
      const r = await fetch('/api/contacto', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'No se pudo enviar.')
      setEstado('ok')
    } catch (err) {
      setError(err.message)
      setEstado('')
    }
  }

  if (estado === 'ok') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-600 text-white grid place-items-center text-2xl">✓</div>
        <h3 className="mt-4 text-lg font-black text-slate-900">¡Mensaje enviado!</h3>
        <p className="mt-1 text-slate-600">Gracias, {f.nombre.split(' ')[0]}. Te respondemos a la brevedad a {f.correo}.</p>
        <button type="button" onClick={() => { setF({ nombre: '', correo: '', telefono: '', motivo: '', mensaje: '', empresa: '' }); setEstado('') }}
          className="mt-5 text-sm font-semibold text-brand-700 hover:underline">Enviar otro mensaje</button>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-3" noValidate>
      {/* Trampa para bots: invisible para personas */}
      <input type="text" name="empresa" value={f.empresa} onChange={set('empresa')} tabIndex={-1} autoComplete="off"
        className="hidden" aria-hidden="true" />

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="relative block">
          <span className="sr-only">Nombre completo</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Ico n="user" /></span>
          <input required value={f.nombre} onChange={set('nombre')} placeholder="Nombre completo *" autoComplete="name" className={campo} />
        </label>
        <label className="relative block">
          <span className="sr-only">Correo electrónico</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Ico n="mail" /></span>
          <input required type="email" value={f.correo} onChange={set('correo')} placeholder="Correo electrónico *" autoComplete="email" className={campo} />
        </label>
      </div>

      <label className="relative block">
        <span className="sr-only">Teléfono</span>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Ico n="phone" /></span>
        <input type="tel" value={f.telefono} onChange={set('telefono')} placeholder="Teléfono (opcional)" autoComplete="tel" className={campo} />
      </label>

      <label className="block">
        <span className="block text-[13px] text-slate-600 mb-1">¿En qué podemos ayudarte? *</span>
        <select required value={f.motivo} onChange={set('motivo')}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-[15px] text-slate-800 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100">
          <option value="">Selecciona una opción</option>
          {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>

      <label className="relative block">
        <span className="sr-only">Mensaje</span>
        <span className="absolute left-3 top-3.5 text-slate-400"><Ico n="chat" /></span>
        <textarea required rows={5} value={f.mensaje} onChange={set('mensaje')} placeholder="Mensaje *  Cuéntanos en qué podemos ayudarte…"
          className={`${campo} resize-y min-h-[140px]`} />
      </label>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button type="submit" disabled={estado === 'enviando'}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 disabled:opacity-60 transition">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-8-8-2Z" /></svg>
        {estado === 'enviando' ? 'Enviando…' : 'Enviar mensaje'}
      </button>
      <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        Tus datos están seguros con nosotros.
      </p>
    </form>
  )
}
