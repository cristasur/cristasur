'use client'
// ============================================================
// /admin/portada — Bloques de la portada de la tienda
//
// Cada bloque (HomeSection) se puede agregar, ordenar, prender /
// apagar, editar y eliminar. Ver src/models/HomeSection.js para
// lo que significa cada campo en cada tipo de bloque.
// ============================================================
import { useState, useEffect, useRef } from 'react'
import { parseInstagram } from '@/lib/instagram'
import { upload as subirABlob } from '@vercel/blob/client'
import { estiloEncuadre, normalizarEncuadre, ENCUADRE_CENTRO } from '@/lib/encuadre'

const TIPOS = {
  carrusel:    'Carrusel de productos',
  reels:       'Contenido reciente',
  colecciones: 'Colecciones destacadas',
  mosaico:     'Mosaico',
  promos:      'Promociones',
  porque:      'Por qué elegirnos',
  resenas:     'Reseñas',
}

// Descripción e ícono de cada tipo, para el panel "Agregar bloque"
// y para identificar cada fila de la lista.
const INFO = {
  carrusel:    { ic: '▭▭▭', txt: 'Productos en fila que avanzan a la derecha. Por categoría, más vendidos, destacados o nuevos.' },
  reels:       { ic: '▯▯▯', txt: 'Videos o fotos verticales de tus redes, con link a Instagram o TikTok.' },
  colecciones: { ic: '☰ ▣', txt: 'Lista de colecciones a la izquierda y foto grande a la derecha.' },
  mosaico:     { ic: '▣ ▪▪', txt: 'Un cuadro grande y hasta 4 chicos con foto y link.' },
  promos:      { ic: '％', txt: 'Dos promociones con sello de descuento y banner de marca opcional.' },
  porque:      { ic: '★', txt: 'Las razones para comprarte: precios, sucursales, envíos…' },
  resenas:     { ic: '❝', txt: 'Opiniones de clientes con estrellas y calificación de Google.' },
}

const FUENTES = {
  categoria:   'Por categoría',
  masVendidos: 'Más vendidos',
  destacados:  'Destacados',
  nuevos:      'Nuevos',
}

// Valores iniciales al agregar un bloque nuevo (se crea apagado si necesita fotos)
const NUEVOS = {
  carrusel:    { title: 'Más vendidos', source: 'masVendidos', limit: 12, active: true },
  reels:       { title: 'Contenido reciente', active: false, items: [] },
  colecciones: { title: 'Colecciones destacadas', active: false, items: [] },
  mosaico:     { title: '', active: false, items: [] },
  promos:      { title: '', active: false, items: [], data: { textoTitulo: '', texto: '', boton: '', botonHref: '' } },
  porque:      { title: '¿Por qué elegir CRISTASUR?', subtitle: 'Nuestra promesa', active: true, items: [] },
  resenas:     { title: 'Lo que dicen nuestros clientes', active: true, items: [], data: { rating: 4.8, reviewsUrl: '', writeUrl: '' } },
}

// Tipos con items que llevan imagen (para avisar de las que faltan)
const CON_IMAGEN = ['reels', 'colecciones', 'mosaico', 'promos']
// En reels la portada es opcional: si hay link de Instagram se toma sola.
const IMAGEN_OBLIGATORIA = ['colecciones', 'mosaico', 'promos']
const MAX_ITEMS = { mosaico: 5, promos: 3 }

const inputCls = 'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400'

async function subirImagen(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('folder', 'portada')
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al subir')
  return data.url
}

function catId(c) { return c && typeof c === 'object' ? c._id : c || '' }

/** Nombre del cuadro según el tipo y la posición. */
function nombreItem(tipo, i) {
  if (tipo === 'mosaico') return i === 0 ? 'Cuadro grande' : 'Cuadro chico'
  if (tipo === 'promos') return i < 2 ? 'Promoción' : 'Banner de marca (opcional)'
  if (tipo === 'reels') return 'Reel'
  if (tipo === 'colecciones') return 'Colección'
  if (tipo === 'porque') return 'Razón'
  if (tipo === 'resenas') return 'Reseña'
  return 'Elemento'
}

/** Medida recomendada de la imagen del item. */
function medidaItem(tipo, i) {
  if (tipo === 'reels') return '1080 × 1350 px (vertical). Si no pones, se usa el video'
  if (tipo === 'colecciones') return '1200 × 1200 px'
  if (tipo === 'mosaico') return i === 0 ? '900 × 1000 px' : '700 × 500 px'
  if (tipo === 'promos') return i < 2 ? '1200 × 600 px' : '1200 × 500 px'
  return ''
}

// ── Campo de texto con etiqueta ─────────────────────────────
function Campo({ label, value, onChange, placeholder, area, type = 'text', ayuda }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      {area ? (
        <textarea rows={3} value={value ?? ''} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} className={inputCls} />
      ) : (
        <input type={type} value={value ?? ''} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} className={inputCls} />
      )}
      {ayuda && <p className="text-[11px] text-slate-400 mt-1">{ayuda}</p>}
    </div>
  )
}

// ── Imagen: subir archivo o pegar URL ───────────────────────
function CampoImagen({ label, medida, url, onUrl, onError }) {
  const ref = useRef()
  const [subiendo, setSubiendo] = useState(false)

  async function alElegir(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSubiendo(true)
    try {
      onUrl(await subirImagen(file))
    } catch (err) {
      onError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label} {medida && <span className="font-normal text-slate-400">· {medida}</span>}
      </label>
      <div className="flex gap-3 items-start">
        <button type="button" onClick={() => ref.current?.click()}
          className="relative shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50 overflow-hidden flex items-center justify-center text-[11px] text-slate-400 text-center">
          {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <span className="px-1">Subir imagen</span>}
          {subiendo && (
            <span className="absolute inset-0 bg-white/80 flex items-center justify-center text-xs font-semibold text-brand-600">Subiendo…</span>
          )}
        </button>
        <div className="flex-1 min-w-0 space-y-1.5">
          <input type="text" value={url || ''} onChange={(e) => onUrl(e.target.value)}
            placeholder="…o pega aquí la URL de la imagen" className={inputCls} />
          <div className="flex gap-2">
            <button type="button" onClick={() => ref.current?.click()}
              className="text-xs font-semibold text-brand-700 hover:underline">
              {url ? 'Cambiar imagen' : 'Subir desde la compu'}
            </button>
            {url && (
              <button type="button" onClick={() => onUrl('')} className="text-xs text-red-600 hover:underline">Quitar</button>
            )}
          </div>
        </div>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={alElegir} />
    </div>
  )
}

// ── Video: subir mp4 y sacar la portada de un cuadro ────────
// El video va directo del navegador a Vercel Blob (no pasa por el
// servidor). Para la portada se dibuja el cuadro elegido en un
// canvas y se sube como imagen normal.
function CampoVideo({ url, onUrl, onPortada, onError }) {
  const inputRef = useRef()
  const videoRef = useRef()
  const [subiendo, setSubiendo] = useState(0)     // % de avance, 0 = nada
  const [dur, setDur] = useState(0)
  const [t, setT] = useState(0)
  const [sacando, setSacando] = useState(false)

  async function alElegir(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 150 * 1024 * 1024) return onError('El video pesa más de 150 MB. Recórtalo o comprímelo.')
    setSubiendo(1)
    try {
      const limpio = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+/, '') || 'video.mp4'
      const blob = await subirABlob(`portada/videos/${limpio}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/video',
        contentType: file.type || 'video/mp4',
        onUploadProgress: (ev) => setSubiendo(Math.max(1, Math.round(ev.percentage))),
      })
      onUrl(blob.url)
    } catch (err) {
      onError(err.message || 'No se pudo subir el video')
    } finally {
      setSubiendo(0)
    }
  }

  async function usarCuadro() {
    const v = videoRef.current
    if (!v || !v.videoWidth) return onError('Espera a que cargue el video.')
    setSacando(true)
    try {
      // Recorte vertical 4:5 centrado, como se ve en la tienda
      const w = v.videoWidth, h = v.videoHeight
      let cw = w, ch = Math.round(w * 1.25)
      if (ch > h) { ch = h; cw = Math.round(h / 1.25) }
      const escala = Math.min(1, 1080 / cw)
      const c = document.createElement('canvas')
      c.width = Math.round(cw * escala)
      c.height = Math.round(ch * escala)
      c.getContext('2d').drawImage(v, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, c.width, c.height)
      const blob = await new Promise((ok, mal) => c.toBlob((b) => (b ? ok(b) : mal(new Error('No se pudo leer el cuadro'))), 'image/jpeg', 0.9))
      onPortada(await subirImagen(new File([blob], 'portada-reel.jpg', { type: 'image/jpeg' })))
    } catch (err) {
      onError(err.name === 'SecurityError'
        ? 'El navegador no dejó copiar el cuadro de este video. Sube la portada como imagen.'
        : err.message)
    } finally {
      setSacando(false)
    }
  }

  return (
    <div className="sm:col-span-2 rounded-xl border border-slate-200 p-3">
      <label className="block text-xs font-semibold text-slate-600 mb-2">
        Video propio (opcional) <span className="font-normal text-slate-400">· MP4 vertical, máx 150 MB. En la tienda se reproduce solo y sin sonido, como MAHA.</span>
      </label>
      {url ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <video ref={videoRef} src={url} crossOrigin="anonymous" muted playsInline preload="auto"
            onLoadedMetadata={(e) => { setDur(e.currentTarget.duration || 0); e.currentTarget.currentTime = Math.min(0.5, e.currentTarget.duration || 0) }}
            className="w-32 aspect-[4/5] object-cover rounded-lg bg-black shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <span className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Elige el cuadro para la portada</span><span>{t.toFixed(1)} s</span>
              </span>
              <input type="range" min="0" max={dur || 0} step="0.1" value={t} disabled={!dur}
                onChange={(e) => { const v = Number(e.target.value); setT(v); if (videoRef.current) videoRef.current.currentTime = v }}
                className="w-full accent-brand-600" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={usarCuadro} disabled={sacando || !dur}
                className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50">
                {sacando ? 'Guardando…' : 'Usar este cuadro como portada'}
              </button>
              <button type="button" onClick={() => inputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Cambiar video</button>
              <button type="button" onClick={() => onUrl('')} className="px-2 text-xs text-red-600 hover:underline">Quitar</button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={subiendo > 0}
          className="w-full rounded-lg border-2 border-dashed border-slate-200 hover:border-brand-400 bg-slate-50 py-4 text-sm text-slate-500">
          {subiendo > 0 ? `Subiendo video… ${subiendo}%` : 'Subir video desde la compu'}
        </button>
      )}
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={alElegir} />
    </div>
  )
}

// ── Foto de perfil (reseñas): subir y encuadrar en el círculo ─
// Arrastra la foto dentro del círculo y acerca con el zoom. Se
// guarda como item.pos {x, y, zoom}, igual que los banners.
function FotoPerfil({ url, pos, onCambio, onError, nombre }) {
  // Un solo cambio a la vez (foto + encuadre juntos); si se mandan
  // por separado el segundo pisa al primero y la foto se pierde.
  const onPos = (v) => onCambio({ pos: v })
  const input = useRef()
  const caja = useRef()
  const arrastre = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const p = normalizarEncuadre(pos || ENCUADRE_CENTRO)

  async function alElegir(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSubiendo(true)
    try {
      const nueva = await subirImagen(file)
      onCambio({ image: nueva, pos: { ...ENCUADRE_CENTRO } })
    } catch (err) {
      onError(err.message)
    } finally {
      setSubiendo(false)
    }
  }

  const cambiar = (c) => onPos(normalizarEncuadre({ ...p, ...c }))
  function abajo(e) {
    if (!url) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    arrastre.current = { x: e.clientX, y: e.clientY, inicio: p }
  }
  function mover(e) {
    if (!arrastre.current || !caja.current) return
    const r = caja.current.getBoundingClientRect()
    const k = 1.6 / arrastre.current.inicio.zoom
    cambiar({
      x: arrastre.current.inicio.x - ((e.clientX - arrastre.current.x) / r.width) * 100 * k,
      y: arrastre.current.inicio.y - ((e.clientY - arrastre.current.y) / r.height) * 100 * k,
    })
  }
  const soltar = () => { arrastre.current = null }

  const inicial = (nombre || 'C').trim().charAt(0).toUpperCase()

  return (
    <div className="sm:col-span-2 flex items-center gap-4 p-3 rounded-xl border border-slate-200">
      <div ref={caja}
        onPointerDown={abajo} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
        className={`relative w-24 h-24 shrink-0 rounded-full overflow-hidden bg-brand-600 select-none touch-none ring-4 ring-slate-100 ${url ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        {url
          ? <img src={url} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" style={estiloEncuadre(p)} />
          : <span className="absolute inset-0 grid place-items-center text-white text-3xl font-black">{inicial}</span>}
        {subiendo && <span className="absolute inset-0 bg-white/80 grid place-items-center text-xs font-semibold text-brand-700">Subiendo…</span>}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-xs font-semibold text-slate-600">
          Foto de perfil <span className="font-normal text-slate-400">· opcional. {url ? 'Arrástrala para encuadrarla.' : 'Si no pones, sale la inicial.'}</span>
        </div>
        {url && (
          <label className="block">
            <span className="flex justify-between text-[11px] text-slate-500"><span>Zoom</span><span>{Math.round(p.zoom * 100)}%</span></span>
            <input type="range" min="1" max="2.5" step="0.05" value={p.zoom}
              onChange={(e) => cambiar({ zoom: e.target.value })} className="w-full accent-brand-600" />
          </label>
        )}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => input.current?.click()} className="text-xs font-semibold text-brand-700 hover:underline">
            {url ? 'Cambiar foto' : 'Subir foto'}
          </button>
          {url && <button type="button" onClick={() => cambiar(ENCUADRE_CENTRO)} className="text-xs text-slate-500 hover:underline">Centrar</button>}
          {url && <button type="button" onClick={() => onCambio({ image: '', pos: null })} className="text-xs text-red-600 hover:underline">Quitar</button>}
        </div>
      </div>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={alElegir} />
    </div>
  )
}

// ── Encuadre de un reel (cuadro vertical 3:4) ───────────────
// Arrastra el video/foto y usa el zoom para quitar bordes negros
// o acercar. Se ve igual que en la tienda.
function EncuadreReel({ video, imagen, pos, onPos }) {
  const caja = useRef()
  const arrastre = useRef(null)
  const p = normalizarEncuadre(pos || ENCUADRE_CENTRO)
  const cambiar = (c) => onPos(normalizarEncuadre({ ...p, ...c }))
  if (!video && !imagen) return null

  function abajo(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    arrastre.current = { x: e.clientX, y: e.clientY, inicio: p }
  }
  function mover(e) {
    if (!arrastre.current || !caja.current) return
    const r = caja.current.getBoundingClientRect()
    const k = 1.6 / arrastre.current.inicio.zoom
    cambiar({
      x: arrastre.current.inicio.x - ((e.clientX - arrastre.current.x) / r.width) * 100 * k,
      y: arrastre.current.inicio.y - ((e.clientY - arrastre.current.y) / r.height) * 100 * k,
    })
  }
  const soltar = () => { arrastre.current = null }

  return (
    <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 p-3 rounded-xl border border-slate-200">
      <div ref={caja} onPointerDown={abajo} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
        className="relative w-36 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden bg-slate-100 cursor-grab active:cursor-grabbing select-none touch-none">
        {video
          ? <video src={video} poster={imagen || undefined} muted loop autoPlay playsInline
              className="w-full h-full object-cover pointer-events-none" style={estiloEncuadre(p)} />
          : <img src={imagen} alt="" draggable={false} className="w-full h-full object-cover pointer-events-none" style={estiloEncuadre(p)} />}
      </div>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="text-xs font-semibold text-slate-600">
          Encuadre en la tienda <span className="font-normal text-slate-400">· arrastra el cuadro para moverlo; con el zoom quitas bordes negros.</span>
        </div>
        <label className="block">
          <span className="flex justify-between text-[11px] text-slate-500"><span>Zoom (más grande / más chico)</span><span>{Math.round(p.zoom * 100)}%</span></span>
          <input type="range" min="1" max="2.5" step="0.05" value={p.zoom}
            onChange={(e) => cambiar({ zoom: e.target.value })} className="w-full accent-brand-600" />
        </label>
        <label className="block">
          <span className="flex justify-between text-[11px] text-slate-500"><span>Izquierda ↔ Derecha</span><span>{Math.round(p.x)}%</span></span>
          <input type="range" min="0" max="100" step="1" value={p.x}
            onChange={(e) => cambiar({ x: e.target.value })} className="w-full accent-brand-600" />
        </label>
        <label className="block">
          <span className="flex justify-between text-[11px] text-slate-500"><span>Arriba ↕ Abajo</span><span>{Math.round(p.y)}%</span></span>
          <input type="range" min="0" max="100" step="1" value={p.y}
            onChange={(e) => cambiar({ y: e.target.value })} className="w-full accent-brand-600" />
        </label>
        <button type="button" onClick={() => onPos({ ...ENCUADRE_CENTRO })} className="text-xs font-semibold text-slate-500 hover:underline">
          Restablecer
        </button>
      </div>
    </div>
  )
}

// ── Selector de categoría (subcategorías con sangría) ───────
function SelectCategoria({ categorias, value, onChange, vacio = 'Sin categoría' }) {
  const padres = categorias.filter((c) => !c.parent)
  const hijos = (id) => categorias.filter((c) => String(catId(c.parent)) === String(id))
  const huerfanas = categorias.filter((c) => c.parent && !categorias.some((p) => String(p._id) === String(catId(c.parent))))
  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value || null)} className={inputCls}>
      <option value="">{vacio}</option>
      {padres.map((p) => [
        <option key={p._id} value={p._id}>{p.name}{p.active === false ? ' (inactiva)' : ''}</option>,
        ...hijos(p._id).map((h) => (
          <option key={h._id} value={h._id}>{'   — '}{h.name}{h.active === false ? ' (inactiva)' : ''}</option>
        )),
      ])}
      {huerfanas.map((h) => <option key={h._id} value={h._id}>— {h.name}</option>)}
    </select>
  )
}

// ── Editor de un item según el tipo ─────────────────────────
function EditorItem({ tipo, i, item, set, categorias, onError }) {
  const f = (k) => (v) => set({ ...item, [k]: v })
  const img = CON_IMAGEN.includes(tipo)

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {tipo === 'reels' && (
        <div className="sm:col-span-2">
          <Campo label="Link del reel o código de inserción de Instagram" value={item.href}
            onChange={(v) => f('href')(parseInstagram(v)?.url || v)}
            placeholder="https://www.instagram.com/reel/…  o pega el código <blockquote…>"
            ayuda={parseInstagram(item.href)
              ? '✓ Reel reconocido. La portada, el texto y la fecha se toman solos de Instagram.'
              : 'En Instagram: ··· → Insertar → Copiar código, o Copiar enlace. Pega cualquiera de los dos.'} />
        </div>
      )}
      {img && (
        <div className="sm:col-span-2">
          <CampoImagen label={tipo === 'reels' ? 'Portada propia (opcional)' : 'Imagen'} medida={medidaItem(tipo, i)} url={item.image} onUrl={f('image')} onError={onError} />
        </div>
      )}

      {tipo === 'resenas' ? (
        <>
          <FotoPerfil url={item.image} pos={item.pos} nombre={item.author} onError={onError}
            onCambio={(c) => set({ ...item, ...c })} />
          <Campo label="Nombre" value={item.author} onChange={f('author')} placeholder="Ej: María G." />
          <Campo label="Ciudad" value={item.place} onChange={f('place')} placeholder="Ej: Mérida" />
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Estrellas</label>
            <select value={item.stars || 5} onChange={(e) => f('stars')(Number(e.target.value))} className={inputCls}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Campo label="Comentario" value={item.text} onChange={f('text')} area />
          </div>
        </>
      ) : (
        <>
          <Campo label="Título" value={item.title} onChange={f('title')} />
          {(tipo === 'mosaico' ? i === 0 : ['colecciones', 'promos'].includes(tipo)) && (
            <Campo label="Subtítulo" value={item.subtitle} onChange={f('subtitle')} />
          )}
          {tipo !== 'porque' && tipo !== 'reels' && (
            <Campo label="Enlace" value={item.href} onChange={f('href')} placeholder="/productos?q=…" />
          )}
          {tipo === 'reels' && (
            <>
              <CampoVideo url={item.videoUrl} onUrl={f('videoUrl')} onError={onError}
                onPortada={(img) => set({ ...item, image: img })} />
              <EncuadreReel video={item.videoUrl} imagen={item.image} pos={item.pos} onPos={f('pos')} />
              <div className="sm:col-span-2">
                <Campo label="Texto (opcional)" value={item.text} onChange={f('text')} area
                  ayuda="Si lo dejas vacío se usa el texto del reel en Instagram." />
              </div>
            </>
          )}
          {tipo === 'promos' && i < 2 && (
            <>
              <Campo label="Sello (descuento)" value={item.badge} onChange={f('badge')} placeholder="15%" />
              <Campo label="Texto del sello" value={item.badgeLabel} onChange={f('badgeLabel')} placeholder="Ahora" />
            </>
          )}
          {tipo === 'colecciones' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría (sus productos salen como miniaturas)</label>
              <SelectCategoria categorias={categorias} value={catId(item.category)} onChange={f('category')} />
            </div>
          )}
          {(tipo === 'porque' || tipo === 'colecciones' || (tipo === 'mosaico' && i === 0)) && (
            <div className="sm:col-span-2">
              <Campo label="Texto" value={item.text} onChange={f('text')} area />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Editor completo de un bloque (panel modal) ──────────────
function EditorSeccion({ inicial, categorias, onCerrar, onGuardado }) {
  const [s, setS] = useState(() => ({
    ...inicial,
    category: catId(inicial.category) || null,
    items: (inicial.items || []).map((it) => ({ ...it, category: catId(it.category) || null })),
    data: { ...(inicial.data || {}) },
  }))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const tipo = s.type
  const set = (k) => (v) => setS((p) => ({ ...p, [k]: v }))
  const setData = (k) => (v) => setS((p) => ({ ...p, data: { ...p.data, [k]: v } }))
  const max = MAX_ITEMS[tipo] || 50

  function setItem(i, it) { setS((p) => ({ ...p, items: p.items.map((x, j) => (j === i ? it : x)) })) }
  function agregarItem() {
    if (s.items.length >= max) return
    setS((p) => ({ ...p, items: [...p.items, { title: '', stars: 5 }] }))
  }
  function quitarItem(i) {
    if (!confirm('¿Quitar este elemento?')) return
    setS((p) => ({ ...p, items: p.items.filter((_, j) => j !== i) }))
  }
  function moverItem(i, d) {
    const j = i + d
    if (j < 0 || j >= s.items.length) return
    setS((p) => {
      const items = [...p.items]
      ;[items[i], items[j]] = [items[j], items[i]]
      return { ...p, items }
    })
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    setOk('')
    try {
      const body = {
        title: s.title, subtitle: s.subtitle, href: s.href, image: s.image, active: s.active,
        items: s.items, data: s.data,
      }
      if (tipo === 'carrusel') {
        body.source = s.source
        body.category = s.source === 'categoria' ? s.category || null : null
        body.limit = s.limit
        if (s.source === 'categoria' && !s.category) throw new Error('Elige la categoría del carrusel')
      }
      const res = await fetch(`/api/home-sections/${s._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setOk('Cambios guardados ✓')
      onGuardado()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-brand-700 uppercase tracking-wide">{TIPOS[tipo]}</div>
            <h2 className="font-bold text-slate-900">{s.title || 'Sin título'}</h2>
          </div>
          <button onClick={onCerrar} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" aria-label="Cerrar">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

          {/* Comunes */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Campo label="Título" value={s.title} onChange={set('title')} />
            <Campo label="Subtítulo" value={s.subtitle} onChange={set('subtitle')} />
            <Campo label='Enlace "Ver todos" (opcional)' value={s.href} onChange={set('href')} placeholder="/productos" />
            <label className="flex items-center gap-2 text-sm text-slate-700 mt-5">
              <input type="checkbox" checked={!!s.active} onChange={(e) => set('active')(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              Mostrar en la tienda (activo)
            </label>
          </div>

          {/* Carrusel */}
          {tipo === 'carrusel' && (
            <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Productos a mostrar</label>
                <select value={s.source} onChange={(e) => set('source')(e.target.value)} className={inputCls}>
                  {Object.entries(FUENTES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {s.source === 'categoria' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Categoría o subcategoría</label>
                  <SelectCategoria categorias={categorias} value={s.category} onChange={set('category')} vacio="Elige una…" />
                </div>
              )}
              <Campo label="Cuántos productos (4 a 24)" type="number" value={s.limit}
                onChange={(v) => set('limit')(v === '' ? '' : Number(v))} />
            </div>
          )}

          {/* Porque: foto del equipo */}
          {tipo === 'porque' && (
            <CampoImagen label="Foto del equipo" medida="1200 × 900 px" url={s.image} onUrl={set('image')} onError={setError} />
          )}

          {/* Promos: texto junto al banner de marca */}
          {tipo === 'promos' && (
            <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50">
              <div className="sm:col-span-2 text-xs font-semibold text-slate-500 uppercase">Texto junto al banner de marca</div>
              <Campo label="Título del texto" value={s.data.textoTitulo} onChange={setData('textoTitulo')} />
              <Campo label="Texto del botón" value={s.data.boton} onChange={setData('boton')} placeholder="Conócenos" />
              <div className="sm:col-span-2">
                <Campo label="Texto" value={s.data.texto} onChange={setData('texto')} area />
              </div>
              <Campo label="Enlace del botón" value={s.data.botonHref} onChange={setData('botonHref')} placeholder="/quienes-somos" />
            </div>
          )}

          {/* Reels: tamaño de los cuadros */}
          {tipo === 'reels' && (
            <div className="p-4 rounded-xl bg-slate-50">
              <label className="block text-xs font-semibold text-slate-600 mb-2">Tamaño de los cuadros en la tienda</label>
              <div className="inline-flex rounded-lg bg-white border border-slate-200 p-1 text-sm font-semibold">
                {[['chico', 'Chicos'], ['mediano', 'Medianos'], ['grande', 'Grandes']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setData('tamano')(v)}
                    className={`px-4 py-1.5 rounded-md ${(s.data?.tamano || 'mediano') === v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reseñas: calificación y links */}
          {tipo === 'resenas' && (
            <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50">
              <Campo label="Calificación promedio" type="number" value={s.data.rating}
                onChange={(v) => setData('rating')(v === '' ? '' : Number(v))} ayuda="Ej. 4.8" />
              <Campo label="Link a reseñas en Google" value={s.data.reviewsUrl} onChange={setData('reviewsUrl')} placeholder="https://maps.app.goo.gl/…"
                ayuda="En Google Maps abre tu negocio → Compartir → Copiar vínculo." />
              <Campo label='Link "Escribir reseña"' value={s.data.writeUrl} onChange={setData('writeUrl')} placeholder="https://g.page/…/review" />
              {s.data.ejemplo && (
                <label className="sm:col-span-3 flex items-center gap-2 text-sm text-amber-800 bg-amber-50 rounded-lg p-2">
                  <input type="checkbox" checked={!!s.data.ejemplo} onChange={(e) => setData('ejemplo')(e.target.checked)} className="w-4 h-4" />
                  Las reseñas son de ejemplo, reemplázalas con reseñas reales y luego desmarca esta casilla.
                </label>
              )}
            </div>
          )}

          {/* Items */}
          {tipo !== 'carrusel' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm">
                  Elementos <span className="text-slate-400 font-normal">({s.items.length}{MAX_ITEMS[tipo] ? ` de ${max}` : ''})</span>
                </h3>
                <button type="button" onClick={agregarItem} disabled={s.items.length >= max}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold disabled:opacity-40">
                  + Agregar
                </button>
              </div>
              {s.items.length === 0 && (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 text-center">
                  Todavía no hay elementos. Usa “+ Agregar”.
                </div>
              )}
              <div className="space-y-3">
                {s.items.map((it, i) => (
                  <div key={it._id || i} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-slate-700">
                        {i + 1}. {nombreItem(tipo, i)}
                        {tipo === 'resenas' && s.data.ejemplo && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">ejemplo, reemplázala</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moverItem(i, -1)} disabled={i === 0}
                          className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30" title="Subir">↑</button>
                        <button type="button" onClick={() => moverItem(i, 1)} disabled={i === s.items.length - 1}
                          className="w-7 h-7 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30" title="Bajar">↓</button>
                        <button type="button" onClick={() => quitarItem(i)}
                          className="px-2 h-7 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs">Quitar</button>
                      </div>
                    </div>
                    <EditorItem tipo={tipo} i={i} item={it} set={(v) => setItem(i, v)} categorias={categorias} onError={setError} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          {ok && <span className="text-sm text-green-700 mr-auto">{ok}</span>}
          {error && <span className="text-sm text-red-700 mr-auto truncate">{error}</span>}
          <button onClick={onCerrar} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">Cerrar</button>
          <button onClick={guardar} disabled={guardando}
            className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50">
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Resumen corto de un bloque para la lista ────────────────
function resumen(s) {
  if (s.type === 'carrusel') {
    const fuente = s.source === 'categoria' ? (s.category?.name || 'Sin categoría elegida') : FUENTES[s.source]
    return `${fuente} · ${s.limit || 12} productos`
  }
  const n = s.items?.length || 0
  const partes = [`${n} ${n === 1 ? 'elemento' : 'elementos'}`]
  if (IMAGEN_OBLIGATORIA.includes(s.type)) {
    const sinFoto = (s.items || []).filter((it) => !it.image).length
    if (sinFoto) partes.push(`${sinFoto} sin imagen`)
  }
  if (s.type === 'porque' && !s.image) partes.push('sin foto del equipo')
  if (s.type === 'resenas' && s.data?.ejemplo) partes.push('reseñas de ejemplo, reemplázalas')
  return partes.join(' · ')
}

export default function AdminPortadaPage() {
  const [secciones, setSecciones] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [editando, setEditando] = useState(null)
  const [menu, setMenu] = useState(false)
  const [ocupado, setOcupado] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/home-sections?all=1', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar')
      setSecciones(data.sections || [])
    } catch (err) {
      setError(err.message || 'Error al cargar la portada')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    fetch('/api/categories?all=1')
      .then((r) => r.json())
      .then((d) => setCategorias(d.categories || []))
      .catch(() => {})
  }, [])

  async function pedir(url, opts, exito) {
    setError('')
    setAviso('')
    setOcupado(true)
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...opts,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Ocurrió un error')
      if (exito) setAviso(exito)
      await load()
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setOcupado(false)
    }
  }

  function crearSugerida() {
    pedir('/api/home-sections', { method: 'POST', body: JSON.stringify({ seed: true }) },
      'Portada sugerida creada. Sube las fotos de los bloques apagados y actívalos.')
  }

  async function agregar(tipo) {
    setMenu(false)
    const data = await pedir('/api/home-sections', {
      method: 'POST',
      body: JSON.stringify({ type: tipo, ...NUEVOS[tipo] }),
    }, `Bloque "${TIPOS[tipo]}" agregado al final.`)
    if (data?.section) setEditando(data.section)
  }

  function mover(i, d) {
    const j = i + d
    if (j < 0 || j >= secciones.length) return
    const lista = [...secciones]
    ;[lista[i], lista[j]] = [lista[j], lista[i]]
    setSecciones(lista)
    pedir('/api/home-sections', { method: 'PUT', body: JSON.stringify({ order: lista.map((s) => s._id) }) })
  }

  function alternar(s) {
    pedir(`/api/home-sections/${s._id}`, { method: 'PUT', body: JSON.stringify({ active: !s.active }) },
      s.active ? 'Bloque desactivado.' : 'Bloque activado.')
  }

  function eliminar(s) {
    if (!confirm(`¿Eliminar el bloque "${s.title || TIPOS[s.type]}"? Esta acción no se puede deshacer.`)) return
    pedir(`/api/home-sections/${s._id}`, { method: 'DELETE' }, 'Bloque eliminado.')
  }

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-slate-900">Portada de la tienda</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Los bloques que se ven en la página de inicio, en este orden. Muévelos con las flechas, apágalos mientras no tengan fotos y edita su contenido.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50">
            Ver tienda ↗
          </a>
          <button onClick={() => setMenu((m) => !m)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${menu ? 'bg-slate-800 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'}`}>
            {menu ? '× Cerrar' : '+ Agregar bloque'}
          </button>
        </div>
      </div>

      {/* Panel para elegir qué bloque agregar (en línea, sin menú flotante) */}
      {menu && (
        <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-card p-4">
          <div className="text-sm font-bold text-slate-900 mb-3">¿Qué bloque quieres agregar?</div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {Object.entries(TIPOS).map(([k, v]) => (
              <button key={k} onClick={() => agregar(k)}
                className="group text-left rounded-xl border border-slate-200 p-3 hover:border-brand-400 hover:bg-brand-50/50 transition">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 shrink-0 rounded-lg bg-brand-50 text-brand-700 text-xs font-black flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition">
                    {INFO[k]?.ic}
                  </span>
                  <span className="font-semibold text-slate-900 text-sm">{v}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-snug">{INFO[k]?.txt}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
      {aviso && <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm">{aviso}</div>}

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando…</div>
      ) : secciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-8 text-center">
          <h2 className="font-bold text-slate-900 text-lg">La portada todavía no tiene bloques</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
            Podemos crear una portada sugerida: carrusel de más vendidos, contenido reciente, colecciones, mosaico,
            promociones, “¿Por qué elegir CRISTASUR?” y reseñas. Los bloques que necesitan fotos se crean apagados
            para que la tienda no muestre cuadros vacíos; súbelas y actívalos cuando estén listos.
          </p>
          <button onClick={crearSugerida} disabled={ocupado}
            className="mt-5 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold disabled:opacity-50">
            {ocupado ? 'Creando…' : 'Crear portada sugerida'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {secciones.map((s, i) => (
            <div key={s._id}
              className={`rounded-xl border shadow-card p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 ${s.active ? 'bg-white border-slate-100' : 'bg-slate-50 border-dashed border-slate-300'}`}>
              {/* Orden */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-7 text-center text-sm font-black text-slate-300">{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <button onClick={() => mover(i, -1)} disabled={i === 0 || ocupado}
                    className="w-8 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Subir" aria-label="Subir">↑</button>
                  <button onClick={() => mover(i, 1)} disabled={i === secciones.length - 1 || ocupado}
                    className="w-8 h-7 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30" title="Bajar" aria-label="Bajar">↓</button>
                </div>
              </div>
              {/* Tipo + datos */}
              <span className={`hidden sm:flex w-11 h-11 shrink-0 rounded-xl text-xs font-black items-center justify-center ${s.active ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>
                {INFO[s.type]?.ic}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-bold uppercase tracking-wider ${s.active ? 'text-brand-700' : 'text-slate-400'}`}>{TIPOS[s.type] || s.type}</div>
                <div className={`font-bold truncate ${s.active ? 'text-slate-900' : 'text-slate-500'}`}>
                  {s.title || <span className="text-slate-400 font-normal">Sin título</span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">{resumen(s)}</div>
              </div>
              {/* Acciones */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button onClick={() => alternar(s)} disabled={ocupado} role="switch" aria-checked={s.active}
                  title={s.active ? 'Se ve en la tienda. Clic para apagar.' : 'No se ve en la tienda. Clic para prender.'}
                  className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-slate-100">
                  <span className={`relative w-9 h-5 rounded-full transition ${s.active ? 'bg-green-500' : 'bg-slate-300'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${s.active ? 'left-[18px]' : 'left-0.5'}`} />
                  </span>
                  <span className={`text-xs font-bold w-12 text-left ${s.active ? 'text-green-700' : 'text-slate-500'}`}>{s.active ? 'Visible' : 'Oculto'}</span>
                </button>
                <button onClick={() => setEditando(s)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700">Editar</button>
                <button onClick={() => eliminar(s)} disabled={ocupado} aria-label="Eliminar" title="Eliminar"
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <EditorSeccion
          key={editando._id}
          inicial={editando}
          categorias={categorias}
          onCerrar={() => setEditando(null)}
          onGuardado={load}
        />
      )}
    </div>
  )
}
