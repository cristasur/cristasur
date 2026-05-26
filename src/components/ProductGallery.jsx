'use client'
// ============================================================
// Galería del detalle de producto.
//   - Soporta video (YouTube, TikTok, MP4 directo) como primer item.
//   - Imagen grande con flechas ← / → sobre la misma foto.
//   - Tira de miniaturas debajo con navegación lateral.
//   - Soporta teclado (←/→).
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'

// Convierte una URL de YouTube/TikTok en URL de embed.
function getEmbedUrl(url) {
  if (!url) return null
  // YouTube: watch?v=ID, youtu.be/ID, shorts/ID
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  // TikTok: tiktok.com/@user/video/ID
  const tt = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (tt) return `https://www.tiktok.com/embed/v2/${tt[1]}`
  // MP4 directo: lo manejamos aparte con <video>
  return null
}

function isDirectVideo(url) {
  return url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
}

export default function ProductGallery({ images = [], alt = 'Producto', videoUrl = '' }) {
  // Construimos la lista de items base: video (si hay) + imágenes
  const baseItems = useMemo(() => {
    const seen = new Set()
    const imgs = images.filter((u) => {
      if (!u || typeof u !== 'string') return false
      if (seen.has(u)) return false
      seen.add(u)
      return true
    })
    if (videoUrl) return [{ type: 'video', url: videoUrl }, ...imgs.map((u) => ({ type: 'image', url: u }))]
    return imgs.map((u) => ({ type: 'image', url: u }))
  }, [images, videoUrl])

  // Galería de variante activa (null = mostrar galería base)
  const [variantItems, setVariantItems] = useState(null)

  // Lista final: galería de variante si existe, si no la base
  const items = useMemo(() => variantItems ?? baseItems, [baseItems, variantItems])

  const [idx, setIdx] = useState(0)
  const stripRef = useRef(null)

  useEffect(() => { setIdx(0) }, [baseItems.length])

  // Escuchar evento de cambio de variante desde ProductDetailClient
  useEffect(() => {
    function onVariantImage(e) {
      const { mode, images: imgs } = e.detail ?? {}

      if (mode === 'clear' || !imgs || imgs.length === 0) {
        // Restaurar galería base
        setVariantItems(null)
        setIdx(0)
        return
      }

      if (mode === 'gallery') {
        // Reemplazar toda la galería con las fotos de esta variante
        setVariantItems(imgs.map((url) => ({ type: 'image', url, isVariant: true })))
        setIdx(0)
        return
      }

      // mode === 'jump': una sola imagen — saltar a ella en la galería base
      // si ya existe ahí, solo moverse; si no, inyectarla al frente
      const singleUrl = imgs[0]
      const existingIdx = baseItems.findIndex((it) => it.type === 'image' && it.url === singleUrl)
      if (existingIdx >= 0) {
        setVariantItems(null)   // mantener galería base
        setIdx(existingIdx)
      } else {
        // Inyectar al frente sin ocultar el resto de la galería
        setVariantItems([
          { type: 'image', url: singleUrl, isVariant: true },
          ...baseItems,
        ])
        setIdx(0)
      }
    }
    window.addEventListener('cristasur:variant-image', onVariantImage)
    return () => window.removeEventListener('cristasur:variant-image', onVariantImage)
  }, [baseItems])

  const total = items.length
  const hasMany = total > 1
  const goPrev = () => setIdx((i) => (i - 1 + total) % total)
  const goNext = () => setIdx((i) => (i + 1) % total)

  useEffect(() => {
    if (!hasMany) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasMany])

  const scrollStrip = (dir) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  useEffect(() => {
    const el = stripRef.current
    if (!el) return
    const active = el.querySelector(`[data-idx="${idx}"]`)
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [idx])

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 aspect-square grid place-items-center text-slate-200">
        <Icon name="box" className="w-28 h-28" strokeWidth={1.5} />
      </div>
    )
  }

  const current = items[idx]
  const embedUrl = current.type === 'video' ? getEmbedUrl(current.url) : null
  const isDirect = current.type === 'video' && isDirectVideo(current.url)

  return (
    <div>
      {/* Área principal */}
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-card border border-slate-100 aspect-square group">

        {/* Video embed (YouTube / TikTok) */}
        {current.type === 'video' && embedUrl && (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`Video de ${alt}`}
          />
        )}

        {/* Video directo MP4 */}
        {current.type === 'video' && isDirect && (
          <video
            src={current.url}
            className="w-full h-full object-cover"
            controls
            playsInline
          />
        )}

        {/* Imagen normal */}
        {current.type === 'image' && (
          <img
            src={current.url}
            alt={`${alt} — imagen ${idx + 1}`}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        )}

        {hasMany && (
          <>
            <button type="button" onClick={goPrev} aria-label="Anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
              <span className="text-xl leading-none">‹</span>
            </button>
            <button type="button" onClick={goNext} aria-label="Siguiente"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
              <span className="text-xl leading-none">›</span>
            </button>
            <div className="absolute bottom-3 right-3 bg-black/55 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
              {idx + 1} / {total}
            </div>
          </>
        )}
      </div>

      {/* Tira de miniaturas */}
      {hasMany && (
        <div className="relative mt-3">
          {total > 4 && (
            <button type="button" onClick={() => scrollStrip(-1)} aria-label="Ver anteriores"
              className="hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow text-slate-700 hover:bg-slate-50">‹</button>
          )}
          <div ref={stripRef}
            className="flex gap-2 overflow-x-auto scroll-smooth pb-1 px-1 md:px-10 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'thin' }}>
            {items.map((item, i) => {
              const isActive = i === idx
              return (
                <button key={`${item.url}-${i}`} data-idx={i} type="button"
                  onClick={() => setIdx(i)} aria-label={`Ver item ${i + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 snap-start transition-all ${
                    isActive ? 'border-brand-600 ring-2 ring-brand-200' : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}>
                  {item.type === 'video' ? (
                    <div className="w-full h-full bg-slate-900 grid place-items-center">
                      <svg className="w-8 h-8 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  ) : (
                    <>
                      <img src={item.url} alt={`Miniatura ${i + 1}`}
                        className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    </>
                  )}
                </button>
              )
            })}
          </div>
          {total > 4 && (
            <button type="button" onClick={() => scrollStrip(1)} aria-label="Ver siguientes"
              className="hidden md:grid place-items-center absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow text-slate-700 hover:bg-slate-50">›</button>
          )}
        </div>
      )}
    </div>
  )
}
