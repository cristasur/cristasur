'use client'
// Botón de corazón para marcar favoritos. Persiste en localStorage.
// No usa contexto: lee/escribe directo para que el estado viva entre
// tarjetas sin re-renderizar toda la lista. Emite un evento custom
// "cristasur:favorites-changed" para que otros componentes lo escuchen.
import { useCallback, useEffect, useState } from 'react'
import Icon from './Icon'

const STORAGE_KEY = 'cristasur:favorites:v1'
const EVENT = 'cristasur:favorites-changed'

function readFavs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeFavs(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { list } }))
  } catch {}
}

export function useFavorites() {
  const [list, setList] = useState([])
  useEffect(() => {
    setList(readFavs())
    const onChange = (e) => setList(e.detail?.list || readFavs())
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', () => setList(readFavs()))
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  const toggle = useCallback((id) => {
    const current = readFavs()
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id]
    writeFavs(next)
  }, [])
  return { favorites: list, toggle, isFavorite: (id) => list.includes(id) }
}

export default function FavoriteButton({ productId, className = '', size = 'md' }) {
  const [fav, setFav] = useState(false)
  useEffect(() => {
    const sync = () => setFav(readFavs().includes(String(productId)))
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [productId])

  function onClick(e) {
    e.preventDefault()
    e.stopPropagation()
    const current = readFavs()
    const id = String(productId)
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id]
    writeFavs(next)
    setFav(!fav)
  }

  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
  const cls = sizeMap[size] || sizeMap.md

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={fav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
      className={
        'w-9 h-9 grid place-items-center rounded-full backdrop-blur bg-white/80 hover:bg-white transition shadow ' +
        className
      }
    >
      <svg
        viewBox="0 0 24 24"
        className={`${cls} transition ${fav ? 'text-rose-500' : 'text-slate-400'}`}
        fill={fav ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  )
}
