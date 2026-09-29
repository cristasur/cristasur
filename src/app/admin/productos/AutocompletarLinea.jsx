'use client'
// ============================================================
// Campo "Nombre de la línea" con sugerencias en tiempo real.
//
// Escribes "m" → salen las líneas que empiezan con M (Manhattan…);
// luego, más abajo, las que la contienen en otra parte. No distingue
// mayúsculas ni acentos. Flechas ↑ ↓ para moverte, Enter para elegir,
// Esc para cerrar. Si no existe, avisa que se creará una línea nueva.
// ============================================================
import { useMemo, useRef, useState } from 'react'

const clave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export default function AutocompletarLinea({ value, onChange, opciones = [], className = '', placeholder, maxLength = 80 }) {
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const cerrarTimer = useRef(null)

  const q = clave(value)
  const sugerencias = useMemo(() => {
    const unicas = [...new Set(opciones.filter(Boolean))]
    if (!q) return unicas.sort((a, b) => a.localeCompare(b, 'es')).slice(0, 12)
    const empiezan = unicas.filter((o) => clave(o).startsWith(q))
    const contienen = unicas.filter((o) => !clave(o).startsWith(q) && clave(o).includes(q))
    return [...empiezan.sort((a, b) => a.localeCompare(b, 'es')), ...contienen.sort((a, b) => a.localeCompare(b, 'es'))].slice(0, 12)
  }, [opciones, q])

  const exacta = sugerencias.some((o) => clave(o) === q)

  function elegir(o) {
    onChange(o)
    setAbierto(false)
  }

  function teclas(e) {
    if (!abierto && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setAbierto(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((i) => Math.min(i + 1, sugerencias.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && abierto && sugerencias[activo]) { e.preventDefault(); elegir(sugerencias[activo]) }
    else if (e.key === 'Escape') setAbierto(false)
  }

  // Resalta la parte que coincide con lo escrito
  const resaltar = (o) => {
    const i = clave(o).indexOf(q)
    if (!q || i < 0) return o
    return (<>{o.slice(0, i)}<b className="text-slate-900">{o.slice(i, i + q.length)}</b>{o.slice(i + q.length)}</>)
  }

  return (
    <div className="relative">
      <input
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={abierto}
        aria-autocomplete="list"
        onChange={(e) => { onChange(e.target.value); setAbierto(true); setActivo(0) }}
        onFocus={() => { clearTimeout(cerrarTimer.current); setAbierto(true) }}
        onBlur={() => { cerrarTimer.current = setTimeout(() => setAbierto(false), 120) }}
        onKeyDown={teclas}
        className={className}
      />
      {abierto && (sugerencias.length > 0 || q) && (
        <ul role="listbox"
          className="absolute z-30 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg py-1 text-sm">
          {sugerencias.map((o, i) => (
            <li key={o} role="option" aria-selected={i === activo}
              onMouseDown={(e) => { e.preventDefault(); elegir(o) }}
              onMouseEnter={() => setActivo(i)}
              className={`px-3 py-2 cursor-pointer text-slate-600 ${i === activo ? 'bg-brand-50 text-brand-800' : 'hover:bg-slate-50'}`}>
              {resaltar(o)}
            </li>
          ))}
          {q && !exacta && (
            <li className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
              {sugerencias.length ? 'O sigue escribiendo: ' : 'No existe: '}
              se creará la línea nueva <b className="text-slate-600">“{value.trim()}”</b>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
