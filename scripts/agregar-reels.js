#!/usr/bin/env node
// ============================================================
// scripts/agregar-reels.js
// Agrega los reels de Instagram (con su texto) al bloque "Contenido reciente" de
// la portada y lo deja activo. Si el bloque no existe, lo crea
// después del primer carrusel. No duplica reels que ya estén.
//
// USO:  node scripts/agregar-reels.js
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const MATRIZ = '📍CRISTASUR Matriz: Perif. de Mérida Lic. Manuel Berzunza, Col. Leandro Valle (entre Fracc. Los Héroes y Chichí Suárez).'
const TANIL = '📍CRISTASUR Mérida-Camp: Carr. Costera del Golfo 3091, Tanil, Yuc.'

// El texto se guarda en la tienda (Instagram no deja leerlo desde Vercel).
const REELS = [
  {
    href: 'https://www.instagram.com/reel/DdxZHBeTVjV/',
    text: `Cristasur es tu aliado para equipar tu cafetería o restaurante. ☕✨
Descubre nuestra variedad y encuentra todo para tu negocio.

Cotizaciones 📲 999 473 1919

Visítanos en nuestras sucursales.
${MATRIZ}
${TANIL}`,
  },
  {
    href: 'https://www.instagram.com/reel/Db_2aKPzPFu/',
    text: `Todo lo que necesitas para tu evento, en un solo lugar. ✨
Porque cuando se trata de equipar tu servicio, Cristasur lo tiene. 🥂

Visítanos en:
${MATRIZ}
${TANIL}

📲 Cotizaciones: 999 473 1919`,
  },
  {
    href: 'https://www.instagram.com/reel/Dbo3KAFT3rI/',
    text: `La eficiencia también comienza con una buena organización. ✨

Si buscas optimizar los procesos de tu restaurante, bar, hotel o negocio de banquetes, en Cristasur encontrarás soluciones diseñadas para facilitar tu operación.

📲 Cotizaciones: 999 473 1919

${MATRIZ}
${TANIL}`,
  },
  {
    href: 'https://www.instagram.com/reel/DYYjcwUzvFo/',
    text: `Invertir en tu cocina no es un gasto, es una inversión en la experiencia que ofreces a cada cliente. ✨🍽️

En hotelería, banquetes y restaurantes, cada detalle cuenta. Por eso, nuestra línea de productos especializados está diseñada para brindar elegancia, funcionalidad y durabilidad en cada servicio.

📩 cristasur@live.com.mx
📞 999 473 1919

Visítanos
📍 CRISTASUR Matriz: https://maps.app.goo.gl/Cy1Va8jFSt4GvVmr7

#cocina #food #recetas #mesamexico

Todos los precios están sujetos a cambios, consulta la disponibilidad ⚠️`,
  },
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

  // Reels que ya estaban: se les pone el texto si no tenían.
  const actuales = (sec.items || []).map((it) => {
    const r = REELS.find((x) => codigo(x.href) === codigo(it.href))
    return r && !String(it.text || '').trim() ? { ...it, text: r.text } : it
  })
  const ya = new Set(actuales.map((it) => codigo(it.href)).filter(Boolean))
  const nuevos = REELS.filter((r) => !ya.has(codigo(r.href))).map((r) => ({
    _id: new mongoose.Types.ObjectId(),
    title: '', subtitle: '', text: r.text, image: '', href: r.href, videoUrl: '',
    badge: '', badgeLabel: '', category: null, author: '', place: '', stars: 5,
  }))

  // Los nuevos van primero, en el orden de la lista (el más reciente primero).
  const items = [...nuevos, ...actuales]
  await col.updateOne({ _id: sec._id }, { $set: { items, active: true, updatedAt: new Date() } })

  // Reacomoda el orden 0..n por si se insertó con .5
  const todas = await col.find({}).sort({ order: 1, createdAt: 1 }).toArray()
  await Promise.all(todas.map((s, i) => col.updateOne({ _id: s._id }, { $set: { order: i } })))

  console.log(`Listo: ${nuevos.length} reels nuevos, textos puestos, ${items.length} en total. Bloque activo.`)
  await mongoose.disconnect()
}

main().catch((e) => { console.error('Falló:', e.message); process.exit(1) })
