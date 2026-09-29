#!/usr/bin/env node
// ============================================================
// scripts/estructurar-variantes.js
//
// Revisa TODOS los productos y los acomoda al esquema tipo MAHA:
//
//   Variantes          → productos hermanos de la misma LÍNEA, uno por
//                        tamaño/capacidad/tipo (campo lineLabel: "27 cm",
//                        "48 QTS", "Trinche 27 cm").
//   Variante de color  → hermanos con la misma etiqueta y otro color
//                        (campo lineColor: "Rosa"), o las variantes de
//                        color internas del producto (mismo precio).
//
// Cómo decide (solo con el nombre y la categoría, no toca precios ni fotos):
//   1. Saca del nombre el TAMAÑO ("Ø 27 cm", "750 ml", "48 QTS", "12 oz",
//      "No. 5", "30x40 cm", "Chico/Mediano/Grande") y el COLOR ("blanco",
//      "azul marino"…).
//   2. Lo que queda es la BASE ("Plato trinche de cerámica Monet").
//      Productos con la misma base y categoría = una línea.
//   3. Si varias bases comparten un nombre propio de colección ("Monet",
//      "NYC", "Rioja Lines") en la misma categoría principal, se juntan
//      en una sola línea (trinche, postre, tazón y taza de Monet).
//
// NO toca productos que ya tienen línea (a menos que uses --reemplazar),
// ni productos borrados. Tampoco junta ni borra productos.
//
// USO:
//   node scripts/estructurar-variantes.js                → solo revisa y
//        deja el reporte en scripts/reportes/variantes-FECHA.csv (Excel)
//   node scripts/estructurar-variantes.js --aplicar      → guarda los cambios
//        (antes hace un respaldo en scripts/respaldos/)
//   node scripts/estructurar-variantes.js --reemplazar   → también rehace
//        las líneas que ya existían
//   node scripts/estructurar-variantes.js --deshacer scripts/respaldos/variantes-XXXX.json
// ============================================================
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const DATOS = require('../src/lib/colores-datos.json')

const ARGS = process.argv.slice(2)
const APLICAR = ARGS.includes('--aplicar')
const REEMPLAZAR = ARGS.includes('--reemplazar')
const DESHACER = ARGS.includes('--deshacer') ? ARGS[ARGS.indexOf('--deshacer') + 1] : null

// ── Texto ───────────────────────────────────────────────────
const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const clave = (s) => sinAcentos(s).toLowerCase().replace(/[^a-z0-9ñ ]+/g, ' ').replace(/\s+/g, ' ').trim()
const capital = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1)

// ── Colores (mismos datos que usa la tienda) ────────────────
const NO_EN_NOMBRE = new Set(DATOS.noEnNombre)
const FORMAS_COLOR = []
for (const c of DATOS.colores) for (const f of [c.nombre, ...c.sinonimos]) FORMAS_COLOR.push([clave(f), c.nombre])
FORMAS_COLOR.sort((a, b) => b[0].length - a[0].length)
function colorEnNombre(nombre) {
  const t = ` ${clave(nombre)} `
  for (const [f, nombreColor] of FORMAS_COLOR) {
    if (f.length < 3 || NO_EN_NOMBRE.has(f)) continue
    if (t.includes(` ${f} `)) return { color: nombreColor, texto: f }
  }
  return null
}
function normalizarColor(texto) {
  const k = clave(texto)
  if (!k) return ''
  const exacto = FORMAS_COLOR.find(([f]) => f === k) || FORMAS_COLOR.find(([f]) => f === k.split(' ')[0])
  return exacto ? exacto[1] : capital(String(texto).trim())
}
const esEtiquetaColor = (l) => /colou?r|tono/i.test(String(l || ''))

// ── Tamaños ─────────────────────────────────────────────────
const UNIDAD = '(cm|mm|mts?|m|ml|l|lt|lts|litros?|oz|onzas?|qts?|qt|gal|galon(?:es)?|galones|kg|kgs|g|gr|grs|pulg(?:adas)?|in|"|pzas?|piezas?|pz)'
const RE_TAMANOS = [
  new RegExp(`(?:ø\\s*)?\\d+(?:[.,]\\d+)?\\s*[x×]\\s*\\d+(?:[.,]\\d+)?(?:\\s*[x×]\\s*\\d+(?:[.,]\\d+)?)?\\s*${UNIDAD}?(?![a-z])`, 'gi'),
  new RegExp(`\\d+\\s+\\d+\\/\\d+\\s*${UNIDAD}(?![a-z])`, 'gi'),   // 2 1/2 pulgadas
  new RegExp(`(?:ø\\s*)?\\d+(?:[.,]\\d+)?(?:\\s*\\/\\s*\\d+)?\\s*${UNIDAD}(?![a-z])`, 'gi'),
  /\b(?:no\.?|n[úu]m(?:ero)?\.?|#)\s*\d+\b/gi,
  /\b(?:extra\s+grande|extra\s+chic[oa]|chic[oa]|median[oa]|grande|jumbo|mini|individual|familiar|xl|xs)\b/gi,
]
const UNIDAD_BONITA = { l: 'L', lt: 'L', lts: 'L', litro: 'L', litros: 'L', qt: 'QTS', qts: 'QTS', oz: 'oz', onza: 'oz', onzas: 'oz', gal: 'gal', galon: 'gal', galones: 'gal', ml: 'ml', cm: 'cm', mm: 'mm', m: 'm', mt: 'm', mts: 'm', kg: 'kg', kgs: 'kg', g: 'g', gr: 'g', grs: 'g', pulg: '"', pulgadas: '"', in: '"', '"': '"', pza: 'pzas', pzas: 'pzas', pieza: 'pzas', piezas: 'pzas', pz: 'pzas' }
function bonito(token) {
  let t = token.replace(/ø/gi, '').trim()
  t = t.replace(/(\d)\s*([a-z"]+)$/i, (_, d, u) => `${d} ${UNIDAD_BONITA[u.toLowerCase()] || u}`)
  t = t.replace(/\s*[x×]\s*/g, ' x ').replace(/\s+/g, ' ')
  if (/^(no\.?|n[úu]m|#)/i.test(t)) t = 'No. ' + t.replace(/\D+/g, '')
  if (/^[a-z]/i.test(t)) t = capital(t.toLowerCase())
  return t.replace(/(\d),(\d)/g, '$1.$2')
}
function tamanosEnNombre(nombre) {
  let resto = ` ${nombre} `
  const encontrados = []
  for (const re of RE_TAMANOS) {
    resto = resto.replace(re, (m) => { encontrados.push(bonito(m)); return ' ' })
  }
  return { tamanos: encontrados, resto }
}

// ── Análisis de un producto ─────────────────────────────────
const PALABRAS_VACIAS = new Set(['de', 'del', 'para', 'con', 'en', 'y', 'la', 'el', 'los', 'las', 'a', 'x', 'pieza', 'piezas', 'pza'])
function analizar(p) {
  const { tamanos, resto } = tamanosEnNombre(p.name)
  const col = colorEnNombre(resto)
  let base = resto
  if (col) base = ` ${base} `.replace(new RegExp(`\\s${col.texto.replace(/\s+/g, '\\s+')}(?=\\s)`, 'i'), ' ')
  // quitar "de/para/con" que quedan colgando y signos
  base = base.replace(/[()\-–—,;:|/]+/g, ' ').replace(/\s+/g, ' ').trim()
  const palabras = base.split(' ').filter(Boolean)
  while (palabras.length && PALABRAS_VACIAS.has(clave(palabras[palabras.length - 1]))) palabras.pop()
  base = palabras.join(' ')
  const internasColor = (p.variants || []).filter((v) => esEtiquetaColor(v.label))
  return {
    p,
    base,
    claveBase: clave(base),
    tamano: tamanos.join(' '),
    color: col ? col.color : '',
    tieneColoresInternos: internasColor.length > 0,
    categoria: String((p.categories || [])[0] || ''),
  }
}

// Nombre propio de colección: palabras con mayúscula que no son la primera
// ("Monet", "NYC", "Rioja Lines"). Se ignoran unidades, colores y marcas genéricas.
function coleccion(a) {
  const palabras = String(a.p.name).replace(/[()\-–—,;:|/]+/g, ' ').split(/\s+/).filter(Boolean)
  const nombres = []
  let actual = []
  palabras.forEach((w, i) => {
    const limpio = w.replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9]/g, '')
    const esNombre = i > 0 && /^[A-ZÁÉÍÓÚÑ]/.test(limpio) && limpio.length >= 2 &&
      !colorEnNombre(limpio) && !/^(ml|cm|mm|oz|qts?|l|lt|kg|no|pzas?|pz)$/i.test(limpio)
    if (esNombre) actual.push(limpio)
    else if (actual.length) { nombres.push(actual.join(' ')); actual = [] }
  })
  if (actual.length) nombres.push(actual.join(' '))
  return nombres.sort((x, y) => y.length - x.length)[0] || ''
}

// ── Agrupar y proponer ──────────────────────────────────────
function proponer(productos, raizDeCategoria) {
  const analizados = productos.map(analizar)

  // 1) por base + categoría
  const grupos = new Map()
  for (const a of analizados) {
    if (!a.claveBase) continue
    const k = `${a.claveBase}|${a.categoria}`
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k).push(a)
  }

  // 2) juntar bases distintas que comparten colección en la misma categoría principal
  const porColeccion = new Map()
  for (const [k, g] of grupos) {
    const col = coleccion(g[0])
    if (!col) continue
    const kk = `${clave(col)}|${raizDeCategoria(g[0].categoria)}`
    if (!porColeccion.has(kk)) porColeccion.set(kk, { col, claves: [] })
    porColeccion.get(kk).claves.push(k)
  }
  const lineas = []
  const usadas = new Set()
  for (const { col, claves } of porColeccion.values()) {
    if (claves.length < 2) continue
    const miembros = claves.flatMap((k) => grupos.get(k))
    if (miembros.length < 2) continue
    claves.forEach((k) => usadas.add(k))
    lineas.push({ nombre: nombreLinea(miembros, col), miembros, porColeccion: true })
  }
  for (const [k, g] of grupos) {
    if (usadas.has(k) || g.length < 2) continue
    lineas.push({ nombre: nombreLinea(g, ''), miembros: g, porColeccion: false })
  }

  // 3) etiqueta y color de cada miembro
  const propuestas = []
  for (const l of lineas) {
    const tamanos = new Set(l.miembros.map((a) => a.tamano))
    const bases = new Set(l.miembros.map((a) => a.claveBase))
    const colores = new Set(l.miembros.map((a) => a.color))
    const varian = tamanos.size > 1 || bases.size > 1 || colores.size > 1
    if (!varian) {
      for (const a of l.miembros) propuestas.push({ a, linea: l.nombre, etiqueta: '', color: '', accion: 'REVISAR: parecen repetidos (mismo nombre, tamaño y color)' })
      continue
    }
    // Palabras que distinguen una base de otra ("trinche", "postre", "taza")
    const comunes = palabrasComunes(l.miembros.map((a) => a.base))
    for (const a of l.miembros) {
      let etiqueta = a.tamano
      if (bases.size > 1) {
        const tipo = a.base.split(' ').filter((w) => !comunes.has(clave(w)) && !PALABRAS_VACIAS.has(clave(w))).slice(0, 2).join(' ')
        etiqueta = [capital(tipo.toLowerCase()), a.tamano].filter(Boolean).join(' ')
      }
      if (!etiqueta && colores.size > 1 && tamanos.size === 1) etiqueta = ''
      propuestas.push({
        a,
        linea: l.nombre,
        etiqueta: etiqueta.slice(0, 30),
        color: a.tieneColoresInternos ? '' : a.color,
        accion: '',
      })
    }
  }
  return { propuestas, analizados, lineas }
}

function palabrasComunes(bases) {
  const sets = bases.map((b) => new Set(b.split(' ').map(clave)))
  const [primero, ...resto] = sets
  return new Set([...(primero || [])].filter((w) => resto.every((s) => s.has(w))))
}

function nombreLinea(miembros, col) {
  if (col) {
    // "Monet" + lo común de las bases ("cerámica") → "Monet"
    return col.slice(0, 80)
  }
  // La base más corta, tal cual se escribió
  const b = miembros.map((a) => a.base).sort((x, y) => x.length - y.length)[0]
  return capital(b).slice(0, 80)
}

// ── CSV para Excel ──────────────────────────────────────────
const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
function escribirCsv(ruta, filas) {
  fs.mkdirSync(path.dirname(ruta), { recursive: true })
  fs.writeFileSync(ruta, '﻿' + filas.map((f) => f.map(celda).join(',')).join('\r\n'), 'utf8')
}
const sello = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')

// ── Principal ───────────────────────────────────────────────
async function main() {
  if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI en .env.local'); process.exit(1) }
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const col = db.collection('products')

  if (DESHACER) {
    const respaldo = JSON.parse(fs.readFileSync(DESHACER, 'utf8'))
    let n = 0
    for (const r of respaldo) {
      await col.updateOne({ _id: new mongoose.Types.ObjectId(r._id) }, { $set: { line: r.line || '', lineLabel: r.lineLabel || '', lineColor: r.lineColor || '' } })
      n++
    }
    console.log(`Listo: se regresaron ${n} productos como estaban.`)
    return mongoose.disconnect()
  }

  const [productos, categorias] = await Promise.all([
    col.find({ deleted: { $ne: true } }, {
      projection: { name: 1, sku: 1, line: 1, lineLabel: 1, lineColor: 1, color: 1, variants: 1, categories: 1, tags: 1, status: 1, active: 1 },
    }).toArray(),
    db.collection('categories').find({}, { projection: { name: 1, parent: 1 } }).toArray(),
  ])
  const catPorId = new Map(categorias.map((c) => [String(c._id), c]))
  const raiz = (id) => {
    let c = catPorId.get(String(id)), vueltas = 0
    while (c && c.parent && vueltas++ < 5) c = catPorId.get(String(c.parent)) || null
    return c ? String(c._id) : String(id || '')
  }
  const nombreCat = (id) => catPorId.get(String(id))?.name || ''

  const candidatos = REEMPLAZAR ? productos : productos.filter((p) => !p.line)
  const { propuestas, lineas } = proponer(candidatos, raiz)

  // ── Reporte ────────────────────────────────────────────────
  const filas = [['Línea propuesta', 'Producto', 'SKU', 'Categoría', 'Estado',
    'Línea actual', 'Etiqueta actual', 'Color actual', 'Etiqueta propuesta (Variantes)', 'Color propuesto (Variante de color)', 'Colores internos', 'Acción']]
  const cambios = []
  const ordenadas = [...propuestas].sort((x, y) => x.linea.localeCompare(y.linea, 'es') || x.a.p.name.localeCompare(y.a.p.name, 'es'))
  for (const pr of ordenadas) {
    const p = pr.a.p
    let accion = pr.accion
    const set = {}
    if (!accion) {
      if ((p.line || '') !== pr.linea) set.line = pr.linea
      if ((p.lineLabel || '') !== pr.etiqueta) set.lineLabel = pr.etiqueta
      if ((p.lineColor || '') !== pr.color) set.lineColor = pr.color
      accion = Object.keys(set).length ? 'ACOMODAR' : 'sin cambios'
      if (Object.keys(set).length) cambios.push({ p, set })
    }
    const internas = (p.variants || []).filter((v) => esEtiquetaColor(v.label)).map((v) => v.value).join(' / ')
    filas.push([pr.linea, p.name, p.sku, nombreCat((p.categories || [])[0]), p.status === 'draft' ? 'borrador' : p.active === false ? 'inactivo' : 'publicado',
      p.line, p.lineLabel, p.lineColor || p.color, pr.etiqueta, pr.color, internas, accion])
  }

  // Productos con color escrito en el nombre Y variantes internas de color
  const conflictos = productos.filter((p) => colorEnNombre(p.name) && (p.variants || []).some((v) => esEtiquetaColor(v.label)))
  // Variantes internas de color con nombres raros (no se reconoce el color)
  const coloresRaros = new Map()
  for (const p of productos) for (const v of p.variants || []) {
    if (!esEtiquetaColor(v.label)) continue
    if (!FORMAS_COLOR.find(([f]) => f === clave(v.value) || f === clave(v.value).split(' ')[0])) coloresRaros.set(v.value, (coloresRaros.get(v.value) || 0) + 1)
  }
  // Etiquetas (tags)
  const tags = new Map()
  let conTags = 0
  for (const p of productos) {
    if (p.tags?.length) conTags++
    for (const t of p.tags || []) tags.set(t, (tags.get(t) || 0) + 1)
  }

  const ruta = path.join(__dirname, 'reportes', `variantes-${sello()}.csv`)
  escribirCsv(ruta, filas)

  const lineasConCambios = new Set(cambios.map((c) => c.set.line || c.p.line))
  console.log(`\n${APLICAR ? '>>> APLICANDO' : '>>> SOLO REVISIÓN (no se cambia nada)'}`)
  console.log(`Productos revisados: ${productos.length} (${productos.filter((p) => p.line).length} ya tenían línea${REEMPLAZAR ? ', se rehacen' : ', no se tocan'})`)
  console.log(`Líneas encontradas: ${lineas.length} (${lineas.filter((l) => l.porColeccion).length} por nombre de colección)`)
  console.log(`Productos a acomodar: ${cambios.length} en ${lineasConCambios.size} líneas`)
  console.log(`Posibles repetidos para revisar: ${propuestas.filter((p) => p.accion.startsWith('REVISAR')).length}`)
  console.log(`Productos con color en el nombre Y variantes de color internas: ${conflictos.length}`)
  if (coloresRaros.size) console.log(`Colores internos no reconocidos (salen con muestra gris): ${[...coloresRaros.entries()].slice(0, 15).map(([c, n]) => `${c} (${n})`).join(', ')}`)
  console.log(`Etiquetas (tags): ${tags.size} distintas en ${conTags} productos. Ya no se usan para "Productos relacionados"; siguen sirviendo para buscar.`)
  console.log(`\nReporte para Excel: ${ruta}`)
  console.log('Ábrelo, revisa la columna "Acción" y las propuestas. Si algo no te cuadra, corrígelo después en el admin.')

  if (!APLICAR) {
    if (cambios.length) console.log('\nPara guardar los cambios:  node scripts/estructurar-variantes.js --aplicar')
    return mongoose.disconnect()
  }

  // ── Aplicar con respaldo ───────────────────────────────────
  const respaldo = cambios.map(({ p }) => ({ _id: String(p._id), line: p.line || '', lineLabel: p.lineLabel || '', lineColor: p.lineColor || '' }))
  const rutaResp = path.join(__dirname, 'respaldos', `variantes-${sello()}.json`)
  fs.mkdirSync(path.dirname(rutaResp), { recursive: true })
  fs.writeFileSync(rutaResp, JSON.stringify(respaldo, null, 1))
  let n = 0
  for (const { p, set } of cambios) {
    await col.updateOne({ _id: p._id }, {
      $set: { ...set, updatedAt: new Date() },
      $push: { editHistory: { $each: [{ at: new Date(), action: 'bulk-update', source: 'migration',
        changes: `Variantes tipo MAHA: ${Object.entries(set).map(([k, v]) => `${k}="${v}"`).join(', ')}` }], $slice: -100 } },
    })
    n++
  }
  console.log(`\nLISTO: ${n} productos acomodados.`)
  console.log(`Respaldo (para regresar todo como estaba): node scripts/estructurar-variantes.js --deshacer ${path.relative(process.cwd(), rutaResp)}`)
  await mongoose.disconnect()
}

if (require.main === module) {
  main().catch((e) => { console.error('Falló:', e.message); process.exit(1) })
}
module.exports = { analizar, proponer, tamanosEnNombre, colorEnNombre, coleccion }
