'use client'
// Botones para compartir un producto. Soporta:
// - Web Share API (móviles modernos) si existe navigator.share
// - Copiar al portapapeles
// - WhatsApp, Facebook
import { useState } from 'react'
import Icon from './Icon'

export default function ShareButtons({ title, text }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title || 'CRISTASUR')
  const encodedText = encodeURIComponent(text || '')

  async function nativeShare() {
    if (typeof navigator === 'undefined' || !navigator.share) {
      copyLink()
      return
    }
    try {
      await navigator.share({ title, text, url })
    } catch {}
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  const btn =
    'inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500">Compartir:</span>
      <button onClick={nativeShare} className={btn}>
        <Icon name="share" className="w-4 h-4" />
        Compartir
      </button>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        <Icon name="whatsapp" className="w-4 h-4 text-emerald-600" />
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        Facebook
      </a>
      <button onClick={copyLink} className={btn}>
        <Icon name="copy" className="w-4 h-4" />
        {copied ? '¡Copiado!' : 'Copiar link'}
      </button>
    </div>
  )
}
