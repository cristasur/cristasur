'use client'
// Componente de estrellas (lectura o interactivo)
// Ejemplos:
//   <StarRating value={4.3} />  read-only con medias estrellas
//   <StarRating value={rating} onChange={setRating} />  interactivo (1-5)
import { useState } from 'react'

export default function StarRating({
  value = 0,
  onChange,
  size = 'md',
  showValue = false,
}) {
  const [hover, setHover] = useState(0)
  const interactive = typeof onChange === 'function'
  const shown = interactive && hover ? hover : value

  const sizeMap = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' }
  const cls = sizeMap[size] || sizeMap.md

  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`Calificación ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, shown - (i - 1))) // 0..1
        return (
          <button
            type="button"
            key={i}
            disabled={!interactive}
            onClick={() => interactive && onChange(i)}
            onMouseEnter={() => interactive && setHover(i)}
            onMouseLeave={() => interactive && setHover(0)}
            className={
              'relative ' + (interactive ? 'cursor-pointer' : 'cursor-default')
            }
            aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
          >
            <svg viewBox="0 0 24 24" className={`${cls} text-slate-200`} fill="currentColor">
              <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
            </svg>
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className={`${cls} text-amber-400`} fill="currentColor">
                <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
              </svg>
            </span>
          </button>
        )
      })}
      {showValue && (
        <span className="ml-2 text-xs font-semibold text-slate-600">
          {Number(value).toFixed(1)}
        </span>
      )}
    </div>
  )
}
