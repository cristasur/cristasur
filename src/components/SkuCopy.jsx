'use client'
// SKU con botón de copiar. Los clientes de mayoreo piden por SKU,
// así que copiarlo de un clic ahorra errores de dictado.
import { useState } from 'react'

export default function SkuCopy({ sku }) {
  const [copied, setCopied] = useState(false)
  if (!sku) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(sku)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Si el navegador bloquea el portapapeles, el SKU igual se ve.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copiar SKU"
      className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-brand-700 transition-colors"
    >
      <span>SKU:</span>
      <span className="font-mono font-semibold text-brand-700">{sku}</span>
      {copied ? (
        <span className="text-emerald-600 font-semibold">¡Copiado!</span>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}
