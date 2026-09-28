'use client'
// ============================================================
// Galería del detalle de producto.
//   - Soporta video (YouTube, TikTok, MP4 directo) como primer item.
//   - Escritorio (lg+): columna vertical de miniaturas a la IZQUIERDA
//     con flechas ↑ / ↓ cuando hay muchas; imagen grande a la derecha.
//   - Móvil: imagen principal deslizable (swipe) + miniaturas y puntos abajo.
//   - Flechas ← / → sobre la foto, contador "1 / 7" y visor a pantalla completa.
//   - Soporta teclado (←/→ y Esc en el visor).
//   - Escucha 'cristasur:variant-image' (desde ProductDetailClient) y emite
//     'cristasur:gallery-thumb-click' al tocar una miniatura de imagen.
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

// Ícono de "play" para las miniaturas de video
function PlayThumb({ small = false }) {
  return (
    <div className="w-full h-full bg-slate-900 grid place-items-center">
      <svg className={small ? 'w-6 h-6 text-white/80' : 'w-8 h-8 text-white/80'} fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  )
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

  // Galería combinada (base + todas las variantes). null = no activa.
  const [allItems, setAllItems] = useState(null)

  // Galería de variante activa (null = mostrar galería base)
  const [variantItems, setVariantItems] = useState(null)

  // Lista final: allItems tiene prioridad, luego variantItems, luego base
  const items = useMemo(() => allItems ?? variantItems ?? baseItems, [allItems, variantItems, baseItems])

  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const stripRef = useRef(null)   // tira horizontal (móvil)
  const vStripRef = useRef(null)  // columna vertical (escritorio)
  const touchRef = useRef(null)   // inicio del gesto de swipe

  useEffect(() => { setIdx(0) }, [baseItems.length])

  // Escuchar evento de cambio de variante desde ProductDetailClient
  useEffect(() => {
    function onVariantImage(e) {
      const { mode, images: imgs } = e.detail ?? {}

      if (mode === 'clear') {
        setVariantItems(null)
        setIdx(0)
        return
      }

      if (mode === 'all') {
        // Galería combinada base + todas las variantes (se establece al montar)
        if (imgs && imgs.length > 0) {
          // Conservar el video como primer item: la galería combinada solo
          // trae imágenes y antes el video se perdía.
          const vid = e.detail?.videoUrl || videoUrl
          setAllItems([
            ...(vid ? [{ type: 'video', url: vid }] : []),
            ...imgs.map((url) => ({ type: 'image', url })),
          ])
          setVariantItems(null)
          setIdx(0)
        }
        return
      }

      if (mode === 'gallery') {
        if (!imgs || imgs.length === 0) return
        setVariantItems(imgs.map((url) => ({ type: 'image', url, isVariant: true })))
        setIdx(0)
        return
      }

      // mode === 'jump': saltar a una imagen en la lista activa
      if (!imgs || imgs.length === 0) return
      const singleUrl = imgs[0]
      const currentList = allItems ?? baseItems
      const existingIdx = currentList.findIndex((it) => it.type === 'image' && it.url === singleUrl)
      if (existingIdx >= 0) {
        if (!allItems) setVariantItems(null) // solo limpiar si no estamos en modo combinado
        setIdx(existingIdx)
      } else {
        setVariantItems([
          { type: 'image', url: singleUrl, isVariant: true },
          ...baseItems,
        ])
        setIdx(0)
      }
    }
    window.addEventListener('cristasur:variant-image', onVariantImage)
    return () => window.removeEventListener('cristasur:variant-image', onVariantImage)
  }, [allItems, baseItems, videoUrl])

  const total = items.length
  const hasMany = total > 1
  const goPrev = () => setIdx((i) => (i - 1 + total) % total)
  const goNext = () => setIdx((i) => (i + 1) % total)

  // Protección: si la lista cambia y el índice queda fuera de rango
  useEffect(() => {
    if (idx > 0 && idx >= total) setIdx(0)
  }, [idx, total])

  // Teclado: ←/→ navegan; Esc cierra el visor
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { setLightbox(false); return }
      if (!hasMany) return
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + total) % total)
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasMany, total])

  // Bloquear el scroll del documento mientras el visor está abierto
  useEffect(() => {
    if (!lightbox) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [lightbox])

  const scrollStrip = (dir) => {
    const el = stripRef.current
    if (!el) return
    el.scrollBy({ left: dir * 240, behavior: 'smooth' })
  }

  const scrollVStrip = (dir) => {
    const el = vStripRef.current
    if (!el) return
    el.scrollBy({ top: dir * 180, behavior: 'smooth' })
  }

  // Mantener visible la miniatura activa en ambas tiras
  useEffect(() => {
    // Scroll directo en el contenedor (no scrollIntoView) para evitar que
    // iOS Safari desplace el documento entero horizontalmente.
    const h = stripRef.current
    if (h && h.clientWidth > 0) {
      const active = h.querySelector(`[data-idx="${idx}"]`)
      if (active) {
        const thumbCenter = active.offsetLeft + active.offsetWidth / 2
        const targetLeft = thumbCenter - h.clientWidth / 2
        h.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
      }
    }
    const v = vStripRef.current
    if (v && v.clientHeight > 0) {
      const active = v.querySelector(`[data-idx="${idx}"]`)
      if (active) {
        const thumbCenter = active.offsetTop + active.offsetHeight / 2
        const targetTop = thumbCenter - v.clientHeight / 2
        v.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
      }
    }
  }, [idx, total])

  // Clic en miniatura: cambia la foto y avisa a ProductDetailClient para que
  // seleccione la variante dueña de esa imagen (si la hay).
  function onThumbClick(i, item) {
    setIdx(i)
    if (item.type === 'image') {
      window.dispatchEvent(new CustomEvent('cristasur:gallery-thumb-click', { detail: { url: item.url } }))
    }
  }

  // Swipe en móvil sobre la imagen principal
  function onTouchStart(e) {
    const t = e.touches?.[0]
    if (!t) return
    touchRef.current = { x: t.clientX, y: t.clientY }
  }
  function onTouchEnd(e) {
    const start = touchRef.current
    touchRef.current = null
    if (!start || !hasMany) return
    const t = e.changedTouches?.[0]
    if (!t) return
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y
    // Solo gestos claramente horizontales
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return
    if (dx < 0) goNext()
    else goPrev()
  }

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 aspect-square grid place-items-center text-slate-200">
        <Icon name="box" className="w-28 h-28" strokeWidth={1.5} />
      </div>
    )
  }

  const current = items[Math.min(idx, total - 1)]
  const embedUrl = current.type === 'video' ? getEmbedUrl(current.url) : null
  const isDirect = current.type === 'video' && isDirectVideo(current.url)
  const showVArrows = total > 5

  return (
    <div className="lg:flex lg:gap-4 lg:items-start">
      {/* ── Columna vertical de miniaturas (solo escritorio) ── */}
      {hasMany && (
        <div className="hidden lg:flex flex-col items-center gap-2 w-[84px] shrink-0">
          {showVArrows && (
            <button type="button" onClick={() => scrollVStrip(-1)} aria-label="Ver miniaturas anteriores"
              className="w-8 h-6 grid place-items-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Icon name="chevron" className="w-4 h-4 -rotate-90" />
            </button>
          )}
          <div ref={vStripRef}
            className="flex flex-col gap-2.5 overflow-y-auto overscroll-contain max-h-[520px] xl:max-h-[560px] w-full px-0.5 py-0.5 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}>
            {items.map((item, i) => {
              const isActive = i === idx
              return (
                <button key={`v-${item.url}-${i}`} data-idx={i} type="button"
                  onClick={() => onThumbClick(i, item)}
                  aria-label={`Ver item ${i + 1}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-white border-2 transition-all ${
                    isActive ? 'border-slate-900' : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                  }`}>
                  {item.type === 'video'
                    ? <PlayThumb small />
                    : <img src={item.url} alt={`Miniatura ${i + 1}`} className="w-full h-full object-contain p-1" loading="lazy" decoding="async" />}
                </button>
              )
            })}
          </div>
          {showVArrows && (
            <button type="button" onClick={() => scrollVStrip(1)} aria-label="Ver miniaturas siguientes"
              className="w-8 h-6 grid place-items-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              <Icon name="chevron" className="w-4 h-4 rotate-90" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Área principal */}
        <div
          className="relative bg-white rounded-2xl overflow-hidden border border-slate-200 aspect-square group select-none"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >

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

          {/* Imagen normal — object-contain garantiza que NO se corte; el
              fondo blanco rellena cualquier espacio. Clic = visor completo. */}
          {current.type === 'image' && (
            <button type="button" onClick={() => setLightbox(true)} aria-label="Ampliar imagen"
              className="block w-full h-full cursor-zoom-in">
              <img
                src={current.url}
                alt={`${alt} — imagen ${idx + 1}`}
                className="w-full h-full max-w-full object-contain bg-white"
                loading="eager"
                decoding="async"
                draggable={false}
              />
            </button>
          )}

          {current.type === 'image' && (
            <span className="pointer-events-none absolute top-3 right-3 w-9 h-9 hidden md:grid place-items-center rounded-full bg-white/90 text-slate-700 shadow opacity-0 group-hover:opacity-100 transition-opacity">
              <Icon name="search" className="w-4 h-4" />
            </span>
          )}

          {hasMany && (
            <>
              <button type="button" onClick={goPrev} aria-label="Anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 hidden md:grid place-items-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                <span className="text-xl leading-none">‹</span>
              </button>
              <button type="button" onClick={goNext} aria-label="Siguiente"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 hidden md:grid place-items-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                <span className="text-xl leading-none">›</span>
              </button>
              <div className="absolute bottom-3 right-3 bg-black/55 text-white text-[11px] font-semibold px-2 py-1 rounded-full pointer-events-none">
                {idx + 1} / {total}
              </div>
            </>
          )}
        </div>

        {/* Puntos (solo móvil) */}
        {hasMany && total <= 12 && (
          <div className="flex lg:hidden justify-center gap-1.5 mt-3" aria-hidden="true">
            {items.map((_, i) => (
              <span key={`dot-${i}`}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-300'}`} />
            ))}
          </div>
        )}

        {/* Tira horizontal de miniaturas (móvil / tableta) */}
        {hasMany && (
          <div className="relative mt-3 lg:hidden">
            {total > 4 && (
              <button type="button" onClick={() => scrollStrip(-1)} aria-label="Ver anteriores"
                className="hidden md:grid place-items-center absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow text-slate-700 hover:bg-slate-50">‹</button>
            )}
            <div ref={stripRef}
              className="flex gap-2 overflow-x-auto scroll-smooth pb-1 px-1 md:px-10 snap-x snap-mandatory overscroll-x-contain"
              style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}>
              {items.map((item, i) => {
                const isActive = i === idx
                return (
                  <button key={`${item.url}-${i}`} data-idx={i} type="button"
                    onClick={() => onThumbClick(i, item)}
                    aria-label={`Ver item ${i + 1}`}
                    aria-current={isActive ? 'true' : undefined}
                    className={`relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-white border-2 snap-start transition-all ${
                      isActive ? 'border-slate-900' : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                    }`}>
                    {item.type === 'video'
                      ? <PlayThumb />
                      : <img src={item.url} alt={`Miniatura ${i + 1}`} className="w-full h-full object-contain p-0.5" loading="lazy" decoding="async" />}
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

      {/* ── Visor a pantalla completa ── */}
      {lightbox && current.type === 'image' && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Imagen ampliada de ${alt}`}
          onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button type="button" onClick={() => setLightbox(false)} aria-label="Cerrar"
            className="absolute top-4 right-4 w-11 h-11 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white">
            <Icon name="close" className="w-6 h-6" />
          </button>
          <img
            src={current.url}
            alt={`${alt} — imagen ${idx + 1}`}
            className="max-w-[92vw] max-h-[86vh] object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
          {hasMany && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); goPrev() }} aria-label="Anterior"
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl leading-none">‹</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); goNext() }} aria-label="Siguiente"
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 grid place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white text-3xl leading-none">›</button>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/80 text-sm font-semibold">
                {idx + 1} / {total}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
