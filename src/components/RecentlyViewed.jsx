'use client'
// Guarda en localStorage los últimos productos vistos y los muestra.
// Llama a trackView(id) desde la página de detalle.
import { useEffect, useState } from 'react'
import ProductCarousel from './home/ProductCarousel'

const STORAGE_KEY = 'cristasur:recently-viewed:v1'
const MAX = 16

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
      clean.slice(0, 12).map((id) =>
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

  // Como en MAHA: hasta abajo, en carrusel con las mismas tarjetas del catálogo.
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-black text-slate-900 mb-6">Vistos recientemente</h2>
      <ProductCarousel products={products} label="Vistos recientemente" />
    </section>
  )
}
