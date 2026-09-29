'use client'
import { useState } from 'react'

const fecha = (d) => new Date(d).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Merida' })
const soloDigitos = (t) => String(t || '').replace(/\D/g, '')

export default function MensajesLista({ inicial = [] }) {
  const [lista, setLista] = useState(inicial)
  const [filtro, setFiltro] = useState('pendientes')

  async function marcar(m, atendido) {
    setLista((l) => l.map((x) => (x._id === m._id ? { ...x, atendido } : x)))
    await fetch(`/api/contacto/${m._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ atendido }) })
  }
  async function borrar(m) {
    if (!confirm(`¿Borrar el mensaje de ${m.nombre}?`)) return
    const r = await fetch(`/api/contacto/${m._id}`, { method: 'DELETE' })
    if (r.ok) setLista((l) => l.filter((x) => x._id !== m._id))
    else alert('Solo un administrador puede borrar mensajes.')
  }

  const vistos = lista.filter((m) => (filtro === 'pendientes' ? !m.atendido : filtro === 'atendidos' ? m.atendido : true))

  return (
    <div>
      <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold mb-4">
        {[['pendientes', 'Sin atender'], ['atendidos', 'Atendidos'], ['todos', 'Todos']].map(([v, l]) => (
          <button key={v} onClick={() => setFiltro(v)}
            className={`px-4 py-1.5 rounded-md ${filtro === v ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>

      {vistos.length === 0 && <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-500">No hay mensajes aquí.</div>}

      <div className="space-y-3">
        {vistos.map((m) => {
          const tel = soloDigitos(m.telefono)
          const wa = tel ? `https://wa.me/${tel.length === 10 ? '52' + tel : tel}` : null
          return (
            <article key={m._id} className={`bg-white rounded-2xl border p-5 ${m.atendido ? 'border-slate-100 opacity-70' : 'border-brand-200 shadow-card'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-900">{m.nombre} <span className="ml-2 text-xs font-semibold text-brand-700 bg-brand-50 rounded-full px-2 py-0.5">{m.motivo}</span></div>
                  <div className="text-sm text-slate-500">{m.correo}{m.telefono ? ` · ${m.telefono}` : ''} · {fecha(m.createdAt)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={`mailto:${m.correo}?subject=${encodeURIComponent('Re: ' + m.motivo + ' — CRISTASUR')}`}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Responder correo</a>
                  {wa && <a href={wa} target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">WhatsApp</a>}
                  <button onClick={() => marcar(m, !m.atendido)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700">
                    {m.atendido ? 'Marcar pendiente' : 'Marcar atendido'}
                  </button>
                  <button onClick={() => borrar(m)} className="px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50">Borrar</button>
                </div>
              </div>
              <p className="mt-3 text-slate-700 whitespace-pre-line">{m.mensaje}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
