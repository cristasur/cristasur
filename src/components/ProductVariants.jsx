'use client'
// ============================================================
// ProductVariants — filas de variantes de la ficha, estilo MAHA.
//
//   Variantes : Trinche 27 cm        [27 cm] [19 cm] [750 ml] …
//   Variante de color : Blanco       [Blanco] [Rosa] [Amarillo] …
//
// De dónde sale cada fila:
//   · "Variantes": los productos HERMANOS de la misma línea (campo
//     `line`), uno por etiqueta (`lineLabel`: 27 cm, 48 QTS, Grande).
//     Son productos aparte (su precio, su SKU): la miniatura es un
//     enlace. Si el hermano existe en el mismo color que estás viendo,
//     te lleva a ese color.
//   · "Variante de color": los colores del producto. Pueden ser
//       - variantes internas (mismo precio, se elige aquí mismo), y/o
//       - hermanos de la línea con la MISMA etiqueta y otro color
//         (`lineColor`), que son enlaces a su producto.
//   · Variantes internas que no son de color (p. ej. "Diseño") salen
//     en su propia fila "Variante de diseño".
// ============================================================
import Link from 'next/link'
import { normalizarColor, esEtiquetaColor } from '@/lib/colores'

const k = (s) => normalizarColor(s || '').toLowerCase()
const colorDe = (p) => p?.lineColor || p?.color || ''
const primeraImagen = (v, respaldo) => (Array.isArray(v?.images) && v.images[0]) || v?.image || respaldo || ''
const vendible = (v) => v && v.available !== false && (v.stock == null || v.stock > 0)
const numero = (s) => {
  const m = String(s || '').replace(',', '.').match(/\d+(\.\d+)?/)
  return m ? Number(m[0]) : Infinity
}

function Cuadro({ imagen, texto, activo, agotado, href, onClick, titulo }) {
  const cls = `group relative shrink-0 w-[72px] rounded-xl border bg-white p-1 text-center transition
    ${activo ? 'border-slate-900 outline outline-2 outline-offset-2 outline-slate-900' : 'border-slate-200 hover:border-slate-400'}`
  const cuerpo = (
    <>
      <span className="block w-full aspect-square rounded-lg overflow-hidden bg-slate-50">
        {imagen
          ? <img src={imagen} alt="" loading="lazy" className={`w-full h-full object-cover ${agotado ? 'opacity-40' : ''}`} />
          : <span className="w-full h-full grid place-items-center text-[10px] text-slate-400 px-1 leading-tight">{texto}</span>}
      </span>
      <span className={`block mt-1 text-[11.5px] leading-tight font-semibold line-clamp-2 ${activo ? 'text-slate-900' : 'text-slate-500'} ${agotado ? 'line-through' : ''}`}>
        {texto}
      </span>
    </>
  )
  if (href) {
    return <Link href={href} className={cls} title={titulo || texto} scroll={false}>{cuerpo}</Link>
  }
  return (
    <button type="button" onClick={onClick} className={cls} title={titulo || texto} aria-pressed={activo}>
      {cuerpo}
    </button>
  )
}

function Fila({ titulo, valor, children }) {
  return (
    <div>
      <div className="text-[14px] mb-2.5">
        <span className="font-bold text-slate-900">{titulo}</span>
        {valor && <span className="text-slate-600"> : {valor}</span>}
      </div>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </div>
  )
}

export default function ProductVariants({ product, siblings = [], selected, onSelect }) {
  const variantes = Array.isArray(product.variants) ? product.variants : []
  const internasColor = variantes.filter((v) => esEtiquetaColor(v.label))
  const internasOtras = variantes.filter((v) => !esEtiquetaColor(v.label))

  // Color que se está viendo ahora
  const colorActual = selected && esEtiquetaColor(selected.label) ? selected.value : colorDe(product)

  const familia = [product, ...siblings.filter((s) => String(s._id) !== String(product._id))]
  const etiquetaActual = product.lineLabel || ''

  // ── Fila "Variantes" (tamaños / tipos de la línea) ──────────
  const porEtiqueta = new Map()
  for (const p of familia) {
    const e = p.lineLabel || ''
    if (!e) continue
    if (!porEtiqueta.has(e)) porEtiqueta.set(e, [])
    porEtiqueta.get(e).push(p)
  }
  // Orden: primero las de la misma unidad que el actual (cm, ml, QTS…),
  // de mayor a menor; luego las demás unidades igual.
  const unidad = (s) => String(s || '').toLowerCase().replace(/[\d.,\sø]+/g, '').trim()
  const ordenUnidad = [unidad(etiquetaActual)]
  for (const e of porEtiqueta.keys()) if (!ordenUnidad.includes(unidad(e))) ordenUnidad.push(unidad(e))
  const etiquetas = [...porEtiqueta.keys()].sort((a, b) =>
    ordenUnidad.indexOf(unidad(a)) - ordenUnidad.indexOf(unidad(b)) ||
    numero(b) - numero(a) ||
    a.localeCompare(b, 'es', { numeric: true }))
  const filaTamanos = product.line && etiquetas.length >= 2
    ? etiquetas.map((e) => {
        // El tamaño en el que estás: con la foto del color elegido.
        if (e === etiquetaActual) {
          const img = selected && esEtiquetaColor(selected.label) ? primeraImagen(selected, product.image) : product.image
          return { e, actual: true, p: product, imagen: img }
        }
        const cands = porEtiqueta.get(e)
        // Mismo color que el que estás viendo, si existe
        const mismoColor = colorActual && cands.find((p) => k(colorDe(p)) === k(colorActual))
        const conVariante = colorActual && cands.find((p) => (p.variants || []).some((v) => esEtiquetaColor(v.label) && k(v.value) === k(colorActual)))
        const p = mismoColor || conVariante || cands[0]
        const v = conVariante && !mismoColor ? p.variants.find((x) => esEtiquetaColor(x.label) && k(x.value) === k(colorActual)) : null
        return {
          e, p,
          imagen: v ? primeraImagen(v, p.image) : p.image,
          href: `/productos/${p._id}${v ? `?color=${encodeURIComponent(v.value)}` : ''}`,
        }
      })
    : []

  // ── Fila "Variante de color" ────────────────────────────────
  const colores = []
  const vistos = new Set()
  for (const v of internasColor) {
    if (vistos.has(k(v.value))) continue
    vistos.add(k(v.value))
    colores.push({
      clave: `v-${v._id || v.value}`, texto: v.value, imagen: primeraImagen(v, product.image),
      activo: selected && String(selected._id || selected.value) === String(v._id || v.value),
      agotado: !vendible(v), onClick: () => onSelect?.(v),
    })
  }
  if (!internasColor.length && colorDe(product)) {
    vistos.add(k(colorDe(product)))
    colores.push({ clave: 'actual', texto: normalizarColor(colorDe(product)), imagen: product.image, activo: true })
  }
  if (product.line) {
    for (const p of familia) {
      if (String(p._id) === String(product._id)) continue
      if ((p.lineLabel || '') !== etiquetaActual) continue
      const c = colorDe(p)
      if (!c || vistos.has(k(c))) continue
      vistos.add(k(c))
      colores.push({ clave: `p-${p._id}`, texto: normalizarColor(c), imagen: p.image, href: `/productos/${p._id}` })
    }
  }

  // ── Otras variantes internas (Diseño, Modelo…) ──────────────
  const otrasPorLabel = new Map()
  for (const v of internasOtras) {
    const l = v.label || 'Opción'
    if (!otrasPorLabel.has(l)) otrasPorLabel.set(l, [])
    otrasPorLabel.get(l).push(v)
  }

  const hay = filaTamanos.length >= 2 || colores.length >= 2 || otrasPorLabel.size > 0
  if (!hay) return null

  return (
    <div className="space-y-5">
      {filaTamanos.length >= 2 && (
        <Fila titulo="Variantes" valor={etiquetaActual}>
          {filaTamanos.map((t) => (
            <Cuadro key={t.e} texto={t.e} imagen={t.imagen} activo={t.actual} href={t.actual ? null : t.href}
              onClick={t.actual ? () => {} : undefined} titulo={t.p?.name} />
          ))}
        </Fila>
      )}

      {colores.length >= 2 && (
        <Fila titulo="Variante de color" valor={normalizarColor(colorActual)}>
          {colores.map((c) => (
            <Cuadro key={c.clave} texto={c.texto} imagen={c.imagen} activo={c.activo} agotado={c.agotado}
              href={c.href} onClick={c.onClick || (() => {})} />
          ))}
        </Fila>
      )}

      {[...otrasPorLabel.entries()].map(([label, vs]) => (
        <Fila key={label} titulo={`Variante de ${label.toLowerCase()}`}
          valor={selected && selected.label === label ? selected.value : ''}>
          {vs.map((v) => (
            <Cuadro key={v._id || v.value} texto={v.value} imagen={primeraImagen(v, '')}
              activo={selected && String(selected._id || selected.value) === String(v._id || v.value)}
              agotado={!vendible(v)} onClick={() => onSelect?.(v)} />
          ))}
        </Fila>
      ))}
    </div>
  )
}
