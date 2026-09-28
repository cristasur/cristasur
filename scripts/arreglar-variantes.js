#!/usr/bin/env node
// ============================================================
// scripts/arreglar-variantes.js
//
// Revisa TODOS los productos (publicados, borradores, inactivos y
// eliminados) y deja sus variantes en el formato correcto
// (ver "MODELO SIMÉTRICO" en src/models/Product.js):
//
//   · Si el producto tiene color arriba ("Azul") y variantes de color
//     ("Rojo"), el azul se vuelve la PRIMERA variante con las fotos
//     del producto, y el color de arriba queda vacío.
//   · Cada variante se queda solo con los campos del modelo. Se borra
//     la basura vieja (precio por variante, bulkPrice, medidas...).
//   · Variantes repetidas o sin nombre se quitan.
//   · Productos que YA perdieron su color base (la protección vieja lo
//     borraba al guardar) se detectan, y se recupera cuál era desde su
//     historial de cambios. Con --recuperar se agrega de vuelta.
//
// Además AVISA (no cambia) de: precios distintos por color que se
// pierden, SKUs repetidos entre colores, colores sin foto y productos
// que se quedan con una sola opción.
//
// USO:
//   node scripts/arreglar-variantes.js                → solo revisa
//   node scripts/arreglar-variantes.js --aplicar      → arregla
//   node scripts/arreglar-variantes.js --aplicar --recuperar
//                                                      → y recupera colores perdidos
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const APLICAR = process.argv.includes('--aplicar')
const RECUPERAR = process.argv.includes('--recuperar')
const MAX_VARIANTS = 20

const n = (s) => String(s ?? '').trim().toLowerCase()
const esColor = (v) => /color/i.test(String(v?.label || ''))

/** Una variante con SOLO los campos del modelo. */
function limpiar(v) {
  const images = (Array.isArray(v.images) && v.images.length ? v.images : v.image ? [v.image] : [])
    .filter(Boolean).slice(0, 10)
  const out = {
    _id: v._id || new mongoose.Types.ObjectId(),
    label: String(v.label || 'Color').trim(),
    value: String(v.value || '').trim(),
    barcode: v.barcode || '',
    available: v.available !== false,
    stock: v.stock == null || v.stock === '' ? null : Math.max(0, Math.floor(Number(v.stock) || 0)),
    image: v.image || images[0] || '',
    images,
  }
  if (v.sku) out.sku = String(v.sku).trim()
  return out
}

/** El color que la protección vieja borró, según el historial. */
function colorPerdido(p) {
  const hist = Array.isArray(p.editHistory) ? p.editHistory : []
  for (let i = hist.length - 1; i >= 0; i--) {
    for (const d of hist[i].diff || []) {
      if (d.field === 'Color' && d.from && d.from !== '∅' && (!d.to || d.to === '∅')) {
        return String(d.from).replace(/^"|"$/g, '').trim()
      }
    }
  }
  return ''
}

/** Qué hacer con un producto. Función pura: no escribe nada. */
function revisar(p) {
  const cambios = []
  const avisos = []
  const originales = Array.isArray(p.variants) ? p.variants : []
  if (!originales.length) return { cambios, avisos, set: null }

  // 1. Limpiar y quitar repetidas / vacías.
  const vistas = new Set()
  let variantes = []
  for (const v of originales) {
    const l = limpiar(v)
    if (!l.value) { cambios.push('se quitó una variante sin nombre'); continue }
    const k = `${n(l.label)}::${n(l.value)}`
    if (vistas.has(k)) { cambios.push(`se quitó "${l.value}" repetida`); continue }
    vistas.add(k)
    variantes.push(l)
  }
  const basura = originales.some((v) => ['price', 'comparePrice', 'wholesalePrice', 'wholesaleMinQty',
    'bulkPrice', 'bulkMinQty', 'hundredPrice', 'hundredMinQty', 'weight', 'pkgWeight', 'pkgLength',
    'pkgWidth', 'pkgHeight'].some((k) => k in v))
  if (basura) cambios.push('se limpiaron campos viejos de las variantes')

  // 2. Precios distintos por color: se pierden (el precio es del producto).
  for (const v of originales) {
    const difiere = (a, b) => a != null && a !== '' && b != null && Number(a) !== Number(b)
    if (difiere(v.price, p.price) || difiere(v.wholesalePrice, p.wholesalePrice)) {
      avisos.push(`"${v.value}" tenía precio propio ($${v.price ?? '–'} / mayoreo $${v.wholesalePrice ?? '–'}); ` +
        `queda con el del producto ($${p.price} / mayoreo $${p.wholesalePrice ?? '–'})`)
    }
  }

  // 3. Color de arriba → primera variante.
  let color = p.color || ''
  const hayColor = variantes.some(esColor)
  const base = String(p.color || '').trim()
  if (base && hayColor) {
    if (!variantes.some((v) => n(v.value) === n(base))) {
      if (variantes.length >= MAX_VARIANTS) {
        avisos.push(`el color "${base}" no cabe como variante (ya hay ${MAX_VARIANTS}); revísalo a mano`)
      } else {
        const fotos = [p.image, ...(p.gallery || [])].filter(Boolean).slice(0, 10)
        variantes.unshift(limpiar({ label: 'Color', value: base, sku: p.sku, image: fotos[0], images: fotos }))
        cambios.push(`"${base}" de arriba ahora es la variante #1 (con ${fotos.length} fotos)`)
      }
    } else {
      cambios.push(`se vació el color de arriba ("${base}" ya era variante)`)
    }
    color = ''
  }

  // 4. Color que ya se había perdido.
  if (!base && hayColor && variantes.filter(esColor).length === 1) {
    const perdido = colorPerdido(p)
    if (perdido && !variantes.some((v) => n(v.value) === n(perdido))) {
      if (RECUPERAR) {
        const fotos = [p.image, ...(p.gallery || [])].filter(Boolean).slice(0, 10)
        variantes.unshift(limpiar({ label: 'Color', value: perdido, sku: p.sku, image: fotos[0], images: fotos }))
        cambios.push(`se recuperó "${perdido}" (se había borrado al guardar) como variante #1`)
      } else {
        avisos.push(`parece que perdió su color "${perdido}" al guardarse; córrelo con --recuperar para regresarlo`)
      }
    } else if (!perdido) {
      avisos.push('tiene una sola variante de color; revisa si falta el color principal')
    }
  }

  // 5. Avisos finales.
  const skus = new Map()
  for (const v of variantes) {
    const s = n(v.sku || p.sku)
    if (!s) continue
    skus.set(s, (skus.get(s) || []).concat(v.value))
  }
  for (const [s, cuales] of skus) {
    if (cuales.length > 1) avisos.push(`SKU "${s.toUpperCase()}" repetido en: ${cuales.join(', ')} (ponle SKU propio a cada color en el admin)`)
  }
  for (const v of variantes) if (!v.image && !v.images.length) avisos.push(`"${v.value}" no tiene foto`)
  if (variantes.length === 1) avisos.push(`solo tiene una opción ("${variantes[0].value}"); con una sola no hace falta variante`)

  const cambio = cambios.length > 0 || color !== (p.color || '')
  return { cambios, avisos, set: cambio ? { variants: variantes, color } : null }
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('Falta MONGODB_URI en .env.local'); process.exit(1) }
  await mongoose.connect(uri)
  const col = mongoose.connection.db.collection('products')

  const productos = await col.find({ $or: [{ 'variants.0': { $exists: true } }, { color: { $nin: ['', null] } }] }).toArray()
  const total = await col.countDocuments({})
  console.log(`\n${APLICAR ? '>>> ARREGLANDO' : '>>> SOLO REVISIÓN (no se cambia nada)'}`)
  console.log(`Productos en la base: ${total}. Con variantes o color: ${productos.length}.\n`)

  let arreglados = 0, conAvisos = 0
  for (const p of productos) {
    const r = revisar(p)
    if (!r.set && !r.avisos.length) continue
    const estado = [p.deleted ? 'ELIMINADO' : '', p.status === 'draft' ? 'borrador' : '', p.active === false ? 'inactivo' : '']
      .filter(Boolean).join(', ')
    console.log(`• ${p.name}${estado ? `  (${estado})` : ''}`)
    if (r.set) console.log(`    variantes: [${(p.variants || []).map((v) => v.value).join(', ')}] → [${r.set.variants.map((v) => v.value).join(', ')}]`)
    for (const c of r.cambios) console.log(`    ✓ ${c}`)
    for (const a of r.avisos) console.log(`    ! ${a}`)
    if (r.avisos.length) conAvisos++
    if (r.set) {
      arreglados++
      if (APLICAR) {
        await col.updateOne({ _id: p._id }, {
          $set: { ...r.set, updatedAt: new Date() },
          $push: { editHistory: { $each: [{ at: new Date(), action: 'update', source: 'migration',
            changes: `Variantes arregladas: ${r.cambios.join('; ')}` }], $slice: -100 } },
        })
      }
    }
  }

  console.log(`\n${APLICAR ? 'ARREGLADOS' : 'SE ARREGLARÍAN'}: ${arreglados} productos · con avisos para revisar: ${conAvisos}`)
  if (!APLICAR && arreglados) console.log('\nPara aplicarlo:  node scripts/arreglar-variantes.js --aplicar')
  await mongoose.disconnect()
}

if (require.main === module) {
  main().catch((e) => { console.error('Falló:', e); process.exit(1) })
}
module.exports = { revisar }
