'use client'
// ============================================================
// /favoritos — Lista de productos guardados en localStorage
// ============================================================
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import Icon from '@/components/Icon'

const STORAGE_KEY = 'cristasur:favorites:v1'

function readFavs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function FavoritosPage() {
  const [products, setProducts] = useState(null) // null = cargando
  const [ids, setIds] = useState([])

  useEffect(() => {
    const favIds = readFavs()
    setIds(favIds)
    if (favIds.length === 0) {
      setProducts([])
      return
    }
    // Fetch de cada producto en paralelo
    Promise.all(
      favIds.map((id) =>
        fetch(`/api/products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      setProducts(results.filter(Boolean))
    })
  }, [])

  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('cristasur:favorites-changed', { detail: { list: [] } }))
    } catch {}
    setProducts([])
    setIds([])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-rose-500" fill="currentColor">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            Mis favoritos
          </h1>
          {products && products.length > 0 && (
            <p className="text-slate-500 text-sm mt-1">{products.length} producto{products.length !== 1 ? 's' : ''} guardado{products.length !== 1 ? 's' : ''}</p>
          )}
        </div>
        {ids.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-slate-500 hover:text-rose-600 underline underline-offset-2"
          >
            Borrar todos
          </button>
        )}
      </div>

      {/* Cargando */}
      {products === null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 aspect-square animate-pulse" />
          ))}
        </div>
      )}

      {/* Sin favoritos */}
      {products !== null && products.length === 0 && (
        <div className="text-center py-24 text-slate-400">
          <svg viewBox="0 0 24 24" className="w-16 h-16 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="font-semibold text-slate-500 text-lg">Aún no tienes favoritos</p>
          <p className="text-sm mt-1 mb-6">Toca el corazón en cualquier producto para guardarlo aquí</p>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-sm"
          >
            Ver catálogo
          </Link>
        </div>
      )}

      {/* Grid de favoritos */}
      {products !== null && products.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
