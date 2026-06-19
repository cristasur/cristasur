'use client'
// ============================================================
// TagsCell — celda de la tabla de productos del admin.
// Muestra los tags como chips. Al hacer clic en "Editar" se abre
// un mini-editor inline con autocomplete (tags que ya existen en
// la BD) para añadir/quitar etiquetas. Guarda con PATCH.
// ============================================================
import { useEffect, useRef, useState } from 'react'

export default function TagsCell({ productId, initialTags = [] }) {
  const [tags, setTags] = useState(Array.isArray(initialTags) ? initialTags : [])
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [allTags, setAllTags] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Cargar todas las tags existentes para el autocomplete (una sola vez al abrir).
  useEffect(() => {
    if (!editing || allTags.length > 0) return
    fetch('/api/products/tags')
      .then((r) => r.json())
      .then((j) => setAllTags(Array.isArray(j?.tags) ? j.tags : []))
      .catch(() => {})
  }, [editing, allTags.length])

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!editing) return
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setEditing(false)
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [editing])

  function normalize(s) {
    return String(s || '').trim().toLowerCase()
  }

  async function persist(nextTags) {
    setSaving(true)
    try {
      const r = await fetch(`/api/products/${productId}?action=tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: nextTags }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        alert(j?.error || 'Error al guardar etiquetas')
        return false
      }
      setTags(Array.isArray(j?.tags) ? j.tags : nextTags)
      return true
    } finally {
      setSaving(false)
    }
  }

  function addTag(raw) {
    const t = String(raw || '').trim().slice(0, 40)
    if (!t) return
    if (tags.some((x) => normalize(x) === normalize(t))) {
      setInput('')
      return
    }
    const next = [...tags, t]
    setTags(next)
    setInput('')
    persist(next)
  }

  function removeTag(tag) {
    const next = tags.filter((t) => t !== tag)
    setTags(next)
    persist(next)
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === 'Escape') {
      setEditing(false)
      setShowSuggestions(false)
    }
  }

  const suggestions = input.length === 0
    ? allTags.slice(0, 8)
    : allTags
        .filter((t) => normalize(t).includes(normalize(input)) && !tags.includes(t))
        .slice(0, 8)

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-1 max-w-[260px]">
        {tags.length === 0 ? (
          <span className="text-slate-400 text-xs italic">Sin etiquetas</span>
        ) : (
          tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
              title={t}
            >
              {t}
            </span>
          ))
        )}
        {tags.length > 4 && (
          <span className="text-[10px] text-slate-500">+{tags.length - 4}</span>
        )}
        <button
          type="button"
          onClick={() => {
            setEditing(true)
            setTimeout(() => inputRef.current?.focus(), 30)
          }}
          className="ml-1 text-[10px] uppercase tracking-wide text-violet-700 hover:text-violet-900 font-bold"
          title="Editar etiquetas"
        >
          ✎
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative max-w-[280px]">
      <div
        className="flex flex-wrap items-center gap-1 p-1.5 rounded-lg border border-violet-300 bg-white focus-within:ring-2 focus-within:ring-violet-200 transition"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 bg-violet-50 text-violet-700 border border-violet-200 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
          >
            {t}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(t)
              }}
              className="text-violet-400 hover:text-rose-600 leading-none"
              aria-label={`Quitar ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={onKeyDown}
          placeholder={tags.length === 0 ? 'Añadir…' : ''}
          className="flex-1 min-w-[60px] outline-none text-[11px] py-0.5"
        />
        {saving && <span className="text-[9px] text-slate-400">guardando…</span>}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg max-h-44 overflow-y-auto text-[11px]">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  addTag(s)
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-violet-50 text-slate-700"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
