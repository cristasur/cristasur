#!/usr/bin/env node
// ============================================================
// scripts/agregar-reels.js
// Agrega los reels de Instagram al bloque "Contenido reciente" de
// la portada y lo deja activo. Si el bloque no existe, lo crea
// después del primer carrusel. No duplica reels que ya estén.
//
// USO:  node scripts/agregar-reels.js
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const REELS = [
  'https://www.instagram.com/reel/DdxZHBeTVjV/',
  'https://www.instagram.com/reel/Db_2aKPzPFu/',
  'https://www.instagram.com/reel/Dbo3KAFT3rI/',
  'https://www.instagram.com/reel/DYYjcwUzvFo/',
]

const codigo = (url = '') => (String(url).match(/\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/) || [])[1] || ''

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('Falta MONGODB_URI en .env.local'); process.exit(1) }
  await mongoose.connect(uri)
  const col = mongoose.connection.db.collection('homesections')

  let sec = await col.findOne({ type: 'reels' }, { sort: { order: 1 } })
  if (!sec) {
    const todas = await col.find({}).sort({ order: 1 }).toArray()
    const iCarrusel = todas.findIndex((s) => s.type === 'carrusel')
    const orden = iCarrusel >= 0 ? todas[iCarrusel].order + 0.5 : 0
    const r = await col.insertOne({
      type: 'reels', title: 'Contenido reciente', subtitle: '', image: '',
      href: 'https://www.instagram.com/cristasurmx/', active: true, order: orden,
      source: 'categoria', category: null, limit: 12, items: [], data: {},
      createdAt: new Date(), updatedAt: new Date(),
    })
    sec = await col.findOne({ _id: r.insertedId })
    console.log('Se creó el bloque "Contenido reciente".')
  }

  const ya = new Set((sec.items || []).map((it) => codigo(it.href)).filter(Boolean))
  const nuevos = REELS.filter((u) => !ya.has(codigo(u))).map((href) => ({
    _id: new mongoose.Types.ObjectId(),
    title: '', subtitle: '', text: '', image: '', href, videoUrl: '',
    badge: '', badgeLabel: '', category: null, author: '', place: '', stars: 5,
  }))

  // Los nuevos van primero, en el orden de la lista (el más reciente primero).
  const items = [...nuevos, ...(sec.items || [])]
  await col.updateOne({ _id: sec._id }, { $set: { items, active: true, updatedAt: new Date() } })

  // Reacomoda el orden 0..n por si se insertó con .5
  const todas = await col.find({}).sort({ order: 1, createdAt: 1 }).toArray()
  await Promise.all(todas.map((s, i) => col.updateOne({ _id: s._id }, { $set: { order: i } })))

  console.log(`Listo: ${nuevos.length} reels agregados (${items.length} en total). Bloque activo.`)
  await mongoose.disconnect()
}

main().catch((e) => { console.error('Falló:', e.message); process.exit(1) })
