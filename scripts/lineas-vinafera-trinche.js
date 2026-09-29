#!/usr/bin/env node
// ============================================================
// scripts/lineas-vinafera-trinche.js
//
// 1) Todos los productos "VINAFERA" → línea "Vinafera Blanch"
//    (trinche, sopero, pastel, plato para taza), cada uno con su
//    etiqueta: "Trinche #27", "Sopero", "Pastel", "Para taza".
// 2) Todos los "PLATO TRINCHE" → segunda línea "Platos trinche",
//    con etiqueta de su colección y medida: "Manhattan 23 cm",
//    "Regina Alaska 23 cm", "Vinafera Blanch #27"…
//    Así el trinche Vinafera sale en las dos filas.
//
// No toca la línea principal de los trinches que ya tenían una
// (ej. Manhattan sigue en su línea con la cacerola).
//
// USO:
//   node scripts/lineas-vinafera-trinche.js            → solo muestra
//   node scripts/lineas-vinafera-trinche.js --aplicar  → guarda
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const APLICAR = process.argv.includes('--aplicar')
const capital = (s) => String(s).toLowerCase().replace(/(^|\s)(\S)/g, (_, a, b) => a + b.toUpperCase())
const MARCAS = /\b(cinsa|imcosa|santa anita|crisa)\b/gi

// "23CM" → "23 cm", "# 27" → "#27"
function medidas(t) {
  const tam = []
  let resto = t.replace(/(\d+(?:[.,]\d+)?)\s*cm\b/gi, (_, n) => { tam.push(`${n} cm`); return ' ' })
  resto = resto.replace(/#\s*(\d+)/g, (_, n) => { tam.push(`#${n}`); return ' ' })
  return { resto: resto.replace(/\s+/g, ' ').trim(), tam: tam.join(' ') }
}

function etiquetaVinafera(nombre) {
  let t = nombre.replace(/vinafera\s*blanch/i, ' ').replace(MARCAS, ' ').replace(/^\s*plato\s+/i, ' ')
  t = t.replace(/\bp\s*\/\s*/i, 'para ')
  const { resto, tam } = medidas(t)
  return capital([resto, tam].filter(Boolean).join(' ')).replace(/Cm\b/g, 'cm').slice(0, 30)
}

function etiquetaTrinche(nombre) {
  let t = nombre.replace(/^\s*plato\s+trinche\s*/i, ' ').replace(MARCAS, ' ')
  const { resto, tam } = medidas(t)
  return capital([resto, tam].filter(Boolean).join(' ')).replace(/Cm\b/g, 'cm').slice(0, 30)
}

async function main() {
  if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI en .env.local'); process.exit(1) }
  await mongoose.connect(process.env.MONGODB_URI)
  const col = mongoose.connection.db.collection('products')
  const vivos = { deleted: { $ne: true } }

  const vinafera = await col.find({ ...vivos, name: /vinafera/i }).project({ name: 1, line: 1, lineLabel: 1 }).toArray()
  const trinches = await col.find({ ...vivos, name: /trinche/i }).project({ name: 1, line2: 1, lineLabel2: 1 }).toArray()

  const cambios = []
  console.log(`\nVINAFERA (${vinafera.length}) → línea "Vinafera Blanch"`)
  for (const p of vinafera) {
    const set = { line: 'Vinafera Blanch', lineLabel: etiquetaVinafera(p.name) }
    console.log(`  • ${p.name}  →  ${set.lineLabel}`)
    cambios.push({ p, set })
  }
  console.log(`\nTRINCHES (${trinches.length}) → segunda línea "Platos trinche"`)
  for (const p of trinches) {
    const set = { line2: 'Platos trinche', lineLabel2: etiquetaTrinche(p.name) }
    console.log(`  • ${p.name}  →  ${set.lineLabel2}`)
    cambios.push({ p, set })
  }

  if (!APLICAR) {
    console.log('\nSolo revisión. Para guardar:  node scripts/lineas-vinafera-trinche.js --aplicar')
    return mongoose.disconnect()
  }
  for (const { p, set } of cambios) {
    await col.updateOne({ _id: p._id }, {
      $set: { ...set, updatedAt: new Date() },
      $push: { editHistory: { $each: [{ at: new Date(), action: 'bulk-update', source: 'migration',
        changes: Object.entries(set).map(([k, v]) => `${k}="${v}"`).join(', ') }], $slice: -100 } },
    })
  }
  console.log(`\nLISTO: ${cambios.length} cambios guardados.`)
  await mongoose.disconnect()
}

if (require.main === module) main().catch((e) => { console.error('Falló:', e.message); process.exit(1) })
module.exports = { etiquetaVinafera, etiquetaTrinche }
