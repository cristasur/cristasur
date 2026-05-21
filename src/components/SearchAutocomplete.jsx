'use client'
// Caja de búsqueda con dropdown de sugerencias en vivo.
// Debouncea 250ms y llama a /api/search/suggest.
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Icon from './Icon'

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

export default function SearchAutocomplete({ className = '' }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({ products: [], categories: [], brands: [] })
  const boxRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({ products: [], categories: [] })
      return
    }
    let cancelled = false
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
        const data = await res.json().catch(() => ({ products: [], categories: [], brands: [] }))
        if (!cancelled) setResults(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [q])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onClick(e) {
      if (!boxRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function submit(e) {
    e.preventDefault()
    if (!q.trim()) return
    router.push(`/productos?q=${encodeURIComponent(q.trim())}`)
    setOpen(false)
  }

  const hasResults =
    results.products.length + results.categories.length + (results.brands?.length || 0) > 0

  return (
    <div ref={boxRef} className={'relative ' + className}>
      <form onSubmit={submit} className="relative">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar productos…"
          className="w-full pl-10 pr-3 py-2 rounded-full border border-slate-200 bg-white text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          aria-label="Buscar"
        />
        <Icon
          name="search"
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </form>

      {open && q.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 max-h-[70vh] overflow-y-auto">
          {loading && (
            <div className="p-3 text-xs text-slate-400">Buscando…</div>
          )}
          {!loading && !hasResults && (
            <div className="p-4 text-sm text-slate-500">Sin resultados.</div>
          )}
          {/* Sección de marcas (con sus productos) */}
          {results.brands?.map((b) => (
            <div key={b._id} className="p-2 border-b border-slate-100">
              <Link
                href={`/productos?brand=${b.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-brand-50 group"
              >
                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-600 bg-brand-50 group-hover:bg-brand-100 px-2 py-0.5 rounded-full">
                  Marca
                </span>
                <span className="text-sm font-bold text-slate-900">{b.name}</span>
                <span className="text-xs text-slate-400 ml-auto">Ver todos →</span>
              </Link>
              {b.products?.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {b.products.map((p) => (
                    <Link
                      key={p._id}
                      href={`/productos/${p._id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 rounded-md bg-slate-100 overflow-hidden shrink-0 grid place-items-center text-slate-300">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="box" className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800 line-clamp-1">{p.name}</div>
                        <div className="text-xs text-brand-700 font-bold">{formatMXN(p.price)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {results.categories.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-2 py-1">
                Categorías
              </div>
              {results.categories.map((c) => (
                <Link
                  key={c._id}
                  href={`/productos?category=${c.slug || c._id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
                >
                  <span className="text-lg">{c.icon}</span>
                  <span>{c.name}</span>
                </Link>
              ))}
            </div>
          )}
          {results.products.length > 0 && (
            <div className="p-2 border-t border-slate-100">
              <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-2 py-1">
                Productos
              </div>
              {results.products.map((p) => (
                <Link
                  key={p._id}
                  href={`/productos/${p._id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50"
                >
                  <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 grid place-items-center text-slate-300">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="box" className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 line-clamp-1">
                      {p.name}
                    </div>
                    <div className="text-xs text-brand-700 font-bold">
                      {formatMXN(p.price)}
                      {p.stock === 0 && (
                        <span className="ml-2 text-rose-500 font-normal">
                          Sin stock
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={submit}
            className="w-full p-3 text-center bg-slate-50 hover:bg-slate-100 text-sm font-semibold text-slate-700 border-t border-slate-100"
          >
            Ver todos los resultados para &quot;{q}&quot;
          </button>
        </div>
      )}
    </div>
  )
}
