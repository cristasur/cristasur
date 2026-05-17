'use client'
// Guarda en localStorage los últimos productos vistos y los muestra.
// Llama a trackView(id) desde la página de detalle.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Icon from './Icon'

const STORAGE_KEY = 'cristasur:recently-viewed:v1'
const MAX = 10

export function trackView(productId) {
  if (typeof window === 'undefined' || !productId) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = JSON.parse(raw || '[]')
    const id = String(productId)
    const filtered = Array.isArray(list) ? list.filter((x) => x !== id) : []
    const next = [id, ...filtered].slice(0, MAX)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {}
}

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

export default function RecentlyViewed({ excludeId }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    let ids = []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      ids = JSON.parse(raw || '[]')
      if (!Array.isArray(ids)) ids = []
    } catch {
      ids = []
    }
    const clean = ids.filter((x) => x !== String(excludeId))
    if (!clean.length) return

    // Cargamos cada producto (tolerante a 404)
    Promise.all(
      clean.slice(0, 6).map((id) =>
        fetch(`/api/products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => d?.product)
          .catch(() => null)
      )
    ).then((list) => {
      setProducts(list.filter(Boolean))
    })
  }, [excludeId])

  if (!products.length) return null

  return (
    <section className="mt-10">
      <h2 className="text-lg font-black text-slate-900 mb-3">
        <Icon name="clock" className="w-5 h-5 inline-block mr-2 text-slate-400" />
        Vistos recientemente
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map((p) => (
          <Link
            key={p._id}
            href={`/productos/${p._id}`}
            className="group block bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-card transition"
          >
            <div className="aspect-square bg-slate-100 overflow-hidden">
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-full grid place-items-center text-slate-300">
                  <Icon name="box" className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="p-2">
              <div className="text-xs font-semibold text-slate-900 line-clamp-2">
                {p.name}
              </div>
              <div className="text-xs text-brand-700 font-bold mt-1">
                {formatMXN(p.price)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
