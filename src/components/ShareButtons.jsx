'use client'
// Botones para compartir un producto. Soporta:
// - Historia para Instagram / Facebook (canvas 9:16)
// - Web Share API (móviles modernos) si existe navigator.share
// - Copiar al portapapeles
// - WhatsApp, Facebook
import { useState } from 'react'
import Icon from './Icon'

/* ── helpers de canvas ─────────────────────────────────────── */
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let cy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy)
      line = word
      cy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
  return cy
}

async function buildStoryCanvas(productImage, productName, price) {
  const W = 1080
  const H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fondo degradado oscuro
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0f172a')
  grad.addColorStop(1, '#1a2e4a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Círculos decorativos de fondo
  ctx.fillStyle = 'rgba(59,130,246,0.08)'
  ctx.beginPath()
  ctx.arc(W * 0.8, H * 0.15, 380, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(W * 0.15, H * 0.75, 280, 0, Math.PI * 2)
  ctx.fill()

  // Marca en la parte superior
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 64px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CRISTASUR', W / 2, 120)
  ctx.font = '32px Arial, sans-serif'
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.fillText('cristasur.com', W / 2, 168)

  // Imagen del producto
  const imgAreaY = 220
  const imgAreaH = H * 0.52
  if (productImage) {
    try {
      const resp = await fetch(productImage, { mode: 'cors' })
      const blob = await resp.blob()
      const imgUrl = URL.createObjectURL(blob)
      const img = new Image()
      await new Promise((res, rej) => {
        img.onload = res
        img.onerror = rej
        img.src = imgUrl
      })
      const maxW = W * 0.82
      const maxH = imgAreaH
      const scale = Math.min(maxW / img.width, maxH / img.height)
      const iw = img.width * scale
      const ih = img.height * scale
      const ix = (W - iw) / 2
      const iy = imgAreaY + (imgAreaH - ih) / 2

      // Tarjeta blanca detrás de la imagen
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      roundRectPath(ctx, ix - 48, iy - 48, iw + 96, ih + 96, 56)
      ctx.fill()

      ctx.drawImage(img, ix, iy, iw, ih)
      URL.revokeObjectURL(imgUrl)
    } catch {
      // No se pudo cargar la imagen — dibuja un placeholder
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      roundRectPath(ctx, 120, imgAreaY, W - 240, imgAreaH, 48)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.font = '100px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('📦', W / 2, imgAreaY + imgAreaH / 2 + 36)
    }
  }

  // Tarjeta inferior con nombre y precio
  const cardY = H * 0.74
  const cardH = H - cardY - 100
  ctx.fillStyle = 'rgba(255,255,255,0.10)'
  roundRectPath(ctx, 60, cardY, W - 120, cardH, 52)
  ctx.fill()

  // Línea decorativa
  ctx.fillStyle = '#3b82f6'
  ctx.fillRect(W / 2 - 40, cardY + 36, 80, 6)

  // Nombre del producto
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 68px Arial, sans-serif`
  ctx.textAlign = 'center'
  const nameY = wrapText(ctx, productName || 'Producto', W / 2, cardY + 108, W - 200, 84)

  // Precio
  if (price) {
    ctx.fillStyle = '#60a5fa'
    ctx.font = 'bold 96px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(price, W / 2, Math.max(nameY + 120, cardY + 260))
  }

  // URL al fondo
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '42px Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('cristasur.com', W / 2, H - 52)

  return canvas
}

/* ── componente principal ──────────────────────────────────── */
export default function ShareButtons({ title, text, productImage, price }) {
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [storyDataUrl, setStoryDataUrl] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const url = typeof window !== 'undefined' ? window.location.href : ''
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title || 'CRISTASUR')

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

  async function openStoryModal() {
    setGenerating(true)
    try {
      const canvas = await buildStoryCanvas(productImage, title, price)
      setStoryDataUrl(canvas.toDataURL('image/jpeg', 0.92))
      setShowModal(true)
    } catch (e) {
      console.error(e)
    }
    setGenerating(false)
  }

  async function downloadStory() {
    if (!storyDataUrl) return
    const a = document.createElement('a')
    a.href = storyDataUrl
    a.download = 'cristasur-historia.jpg'
    a.click()
  }

  async function shareStoryFile() {
    if (!storyDataUrl) return
    try {
      const blob = await (await fetch(storyDataUrl)).blob()
      const file = new File([blob], 'cristasur-historia.jpg', { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: title || 'CRISTASUR' })
      } else {
        downloadStory()
      }
    } catch {
      downloadStory()
    }
  }

  const btn =
    'inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition'

  return (
    <>
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
        {/* Botón historia */}
        <button
          onClick={openStoryModal}
          disabled={generating}
          className={
            btn +
            ' bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-800 disabled:opacity-60'
          }
        >
          {generating ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <span className="text-base leading-none">📸</span>
          )}
          {generating ? 'Generando…' : 'Historia IG / FB'}
        </button>
      </div>

      {/* Modal de historia */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900">Historia lista ✨</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Preview de la historia (relación 9:16) */}
            {storyDataUrl && (
              <div className="mx-auto w-40 aspect-[9/16] rounded-xl overflow-hidden border-2 border-slate-200 shadow">
                <img
                  src={storyDataUrl}
                  alt="Vista previa de historia"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-xs text-slate-500 text-center">
              Descarga la imagen y súbela a tus Historias de Instagram o Facebook.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadStory}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm"
              >
                ⬇️ Descargar
              </button>
              <button
                onClick={shareStoryFile}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90"
              >
                📤 Compartir
              </button>
            </div>

            {/* Deep links a apps */}
            <div className="flex gap-2 justify-center">
              <a
                href="instagram://story-camera"
                className="text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 text-white font-semibold"
              >
                Abrir Instagram
              </a>
              <a
                href="fb://composer/story"
                className="text-xs px-3 py-1.5 rounded-full bg-blue-600 text-white font-semibold"
              >
                Abrir Facebook
              </a>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              Descarga primero → abre la app → sube la imagen a historias.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
