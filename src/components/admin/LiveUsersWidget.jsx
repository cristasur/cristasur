'use client'
// ============================================================
// LiveUsersWidget — muestra cuántas personas hay en la página
// AHORA MISMO (últimos 60 segundos de actividad). Auto-refresh
// cada 5 segundos.
// ============================================================
import { useEffect, useState } from 'react'

function shortPath(p) {
  if (!p) return '/'
  // Acorta paths largos manteniendo el inicio
  return p.length > 50 ? p.slice(0, 47) + '…' : p
}

function nicePathLabel(path) {
  if (path === '/' || !path) return 'Inicio'
  if (path === '/productos') return 'Catálogo'
  if (path.startsWith('/productos/')) return 'Detalle de producto'
  if (path.startsWith('/categoria/')) return 'Categoría: ' + path.split('/').pop()
  if (path === '/carrito') return 'Carrito'
  if (path === '/contacto') return 'Contacto'
  if (path === '/blog' || path.startsWith('/blog/')) return 'Blog'
  if (path.startsWith('/admin')) return 'Admin (' + path + ')'
  if (path.startsWith('/cuenta')) return 'Mi cuenta'
  return shortPath(path)
}

export default function LiveUsersWidget() {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const r = await fetch('/api/admin/presence', { cache: 'no-store' })
        if (!r.ok) {
          if (!cancelled) setError(true)
          return
        }
        const j = await r.json()
        if (!cancelled) {
          setData(j)
          setError(false)
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }
    load()
    const t = setInterval(load, 5000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  const total = data?.total ?? 0
  const logged = data?.logged ?? 0
  const anonymous = data?.anonymous ?? 0

  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-slate-50 transition"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="relative inline-flex w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-block w-3 h-3 rounded-full bg-emerald-500" />
          </span>
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-slate-500">
              En línea ahora
            </div>
            <div className="text-3xl font-black text-slate-900 leading-none">
              {total}
              <span className="text-sm font-semibold text-slate-500 ml-1">
                {total === 1 ? 'persona' : 'personas'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {logged} con sesión · {anonymous} anónimas
            </div>
          </div>
        </div>
        <div className="text-slate-400 text-sm">
          {error ? '⚠️' : open ? '▲' : '▼'}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          <div>
            <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
              Qué están viendo
            </h4>
            {(data?.paths || []).length === 0 ? (
              <p className="text-xs text-slate-400">Sin actividad reciente.</p>
            ) : (
              <ul className="space-y-1">
                {(data?.paths || []).map((p) => (
                  <li
                    key={p.path}
                    className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <span className="text-slate-700 truncate" title={p.path}>
                      {nicePathLabel(p.path)}
                    </span>
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                      {p.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(data?.sessions || []).some((s) => s.email) && (
            <div>
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                Con sesión iniciada
              </h4>
              <ul className="space-y-1">
                {(data?.sessions || [])
                  .filter((s) => s.email)
                  .slice(0, 10)
                  .map((s) => (
                    <li
                      key={s.sessionId}
                      className="flex items-center justify-between text-xs bg-white border border-slate-200 rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate">
                          {s.name || s.email}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {nicePathLabel(s.path)}
                        </div>
                      </div>
                      {s.role && s.role !== 'customer' && (
                        <span className="ml-2 text-[9px] uppercase tracking-wider font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                          {s.role}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <p className="text-[10px] text-slate-400 text-center">
            Actualizado cada 5s · activo = ping en últimos 60s
          </p>
        </div>
      )}
    </div>
  )
}
