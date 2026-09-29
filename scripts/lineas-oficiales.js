#!/usr/bin/env node
// ============================================================
// scripts/lineas-oficiales.js
//
// Deja SOLO las líneas oficiales de la tienda. Todo lo demás se
// queda sin línea (se borran las que el script automático inventó).
//
//   Vinafera · Barcelona · Manhattan · Chicago · Termo Gorila · Titán
//
// Cada producto de esas líneas recibe su etiqueta (lo que sale en
// "Variantes"): tipo + medida, p. ej. "Trinche 23 cm", "Cacerola 23 cm",
// "Taza consomé 220 ml", "Sopero", "38 L".
//
// Para agregar otra línea después: súmala a LINEAS aquí abajo y
// vuelve a correrlo (o captúrala a mano en el admin del producto).
//
// USO:
//   node scripts/lineas-oficiales.js             → solo muestra qué haría
//   node scripts/lineas-oficiales.js --aplicar   → guarda (con respaldo)
//   node scripts/lineas-oficiales.js --deshacer scripts/respaldos/lineas-XXXX.json
// ============================================================
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const LINEAS = [
  { nombre: 'Vinafera', re: /vinafera/i, quitar: /vinafera|blanch/gi },
  { nombre: 'Barcelona', re: /barcelona/i, quitar: /barcelona|opal/gi },
  { nombre: 'Manhattan', re: /manhattan/i, quitar: /manhattan/gi },
  { nombre: 'Chicago', re: /chicago/i, quitar: /chicago|matte/gi },
  { nombre: 'Termo Gorila', re: /gorila/i, quitar: /gorila|termo/gi },
  { nombre: 'Titán', re: /tit[aá]n/i, quitar: /tit[aá]n|termo/gi },
]

const ARGS = process.argv.slice(2)
const APLICAR = ARGS.includes('--aplicar')
const DESHACER = ARGS.includes('--deshacer') ? ARGS[ARGS.indexOf('--deshacer') + 1] : null

const MARCAS = /\b(cinsa|imcosa|nyc|crisa|santa anita)\b/gi
const COLORES = /\b(blanc[oa]|negr[oa]|gris|azul|roj[oa]|verde|rosa|amarill[oa]|beige|caf[eé])\b/gi
const ACENTOS = { tazon: 'tazón', consome: 'consomé', platon: 'platón', cafe: 'café' }

function etiqueta(nombre, linea) {
  let t = ` ${nombre} `.replace(linea.quitar, ' ').replace(MARCAS, ' ').replace(COLORES, ' ')
  t = t.replace(/^\s*plato\s+/i, ' ').replace(/\bp\s*\/\s*/gi, 'para ')
  const tam = []
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*(cm|ml|lts?|l|litros?|oz)\b/gi, (_, n, u) => {
    const unidad = /^(lts?|l|litros?)$/i.test(u) ? 'L' : u.toLowerCase()
    tam.push(`${n.replace(',', '.')} ${unidad}`); return ' '
  })
  t = t.replace(/#\s*(\d+)/g, (_, n) => { tam.push(`#${n}`); return ' ' })
  const palabras = t.replace(/\s+/g, ' ').trim().toLowerCase().split(' ').filter(Boolean)
    .map((w) => ACENTOS[w] || w)
  let texto = [palabras.join(' '), tam.join(' ')].filter(Boolean).join(' ')
  texto = texto.charAt(0).toUpperCase() + texto.slice(1)
  return texto.slice(0, 30)
}

const sello = () => new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')

async function main() {
  if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI en .env.local'); process.exit(1) }
  await mongoose.connect(process.env.MONGODB_URI)
  const col = mongoose.connection.db.collection('products')

  if (DESHACER) {
    const r = JSON.parse(fs.readFileSync(DESHACER, 'utf8'))
    for (const x of r) {
      await col.updateOne({ _id: new mongoose.Types.ObjectId(x._id) }, { $set: { line: x.line, lineLabel: x.lineLabel, lineColor: x.lineColor } })
    }
    console.log(`Listo: ${r.length} productos regresados como estaban.`)
    return mongoose.disconnect()
  }

  const productos = await col.find({ deleted: { $ne: true } })
    .project({ name: 1, line: 1, lineLabel: 1, lineColor: 1 }).toArray()

  const cambios = []
  const porLinea = new Map(LINEAS.map((l) => [l.nombre, []]))
  const quitadas = new Map()

  for (const p of productos) {
    const linea = LINEAS.find((l) => l.re.test(p.name))
    let set
    if (linea) {
      set = { line: linea.nombre, lineLabel: etiqueta(p.name, linea), lineColor: p.lineColor || '' }
      porLinea.get(linea.nombre).push(`${p.name}  →  ${set.lineLabel}${set.lineColor ? ` (${set.lineColor})` : ''}`)
    } else if (p.line || p.lineLabel || p.lineColor) {
      set = { line: '', lineLabel: '', lineColor: '' }
      if (p.line) quitadas.set(p.line, (quitadas.get(p.line) || 0) + 1)
    } else continue
    if (set.line !== (p.line || '') || set.lineLabel !== (p.lineLabel || '') || set.lineColor !== (p.lineColor || '')) {
      cambios.push({ p, set })
    }
  }

  console.log(`\n${APLICAR ? '>>> APLICANDO' : '>>> SOLO REVISIÓN (no se cambia nada)'}\n`)
  for (const [nombre, lista] of porLinea) {
    console.log(`${nombre} (${lista.length})`)
    lista.forEach((x) => console.log(`   • ${x}`))
    if (!lista.length) console.log('   (no se encontró ningún producto con ese nombre)')
  }
  console.log(`\nLíneas que se quitan (${quitadas.size}): ${[...quitadas.entries()].map(([l, n]) => `${l} (${n})`).join(', ') || 'ninguna'}`)
  console.log(`Productos que cambian: ${cambios.length}`)

  if (!APLICAR) {
    console.log('\nPara guardar:  node scripts/lineas-oficiales.js --aplicar')
    return mongoose.disconnect()
  }

  const respaldo = cambios.map(({ p }) => ({ _id: String(p._id), line: p.line || '', lineLabel: p.lineLabel || '', lineColor: p.lineColor || '' }))
  const ruta = path.join(__dirname, 'respaldos', `lineas-${sello()}.json`)
  fs.mkdirSync(path.dirname(ruta), { recursive: true })
  fs.writeFileSync(ruta, JSON.stringify(respaldo, null, 1))
  for (const { p, set } of cambios) {
    await col.updateOne({ _id: p._id }, {
      $set: { ...set, updatedAt: new Date() },
      $push: { editHistory: { $each: [{ at: new Date(), action: 'bulk-update', source: 'migration',
        changes: set.line ? `Línea "${set.line}", etiqueta "${set.lineLabel}"` : 'Se quitó la línea (no es oficial)' }], $slice: -100 } },
    })
  }
  console.log(`\nLISTO: ${cambios.length} productos actualizados.`)
  console.log(`Para regresar todo:  node scripts/lineas-oficiales.js --deshacer ${path.relative(process.cwd(), ruta)}`)
  await mongoose.disconnect()
}

if (require.main === module) main().catch((e) => { console.error('Falló:', e.message); process.exit(1) })
module.exports = { etiqueta, LINEAS }
