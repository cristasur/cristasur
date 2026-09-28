#!/usr/bin/env node
// ============================================================
// scripts/traer-reels.js
// Trae de Instagram el VIDEO y la PORTADA de cada reel que está en
// "Contenido reciente", los sube a Vercel Blob y los guarda en la
// portada. Así los cuadros se reproducen solos, sin nada encima,
// como en MAHA. Si el reel no tiene texto, también trae el texto.
//
// Se corre desde tu compu (Instagram no deja hacerlo desde Vercel).
// Necesita en .env.local:
//   MONGODB_URI=...
//   BLOB_READ_WRITE_TOKEN=...   (Vercel → Storage → tu Blob → .env.local)
//
// USO:
//   node scripts/traer-reels.js            → solo los que no tienen video
//   node scripts/traer-reels.js --todos    → vuelve a traer todos
// Cada que agregues reels nuevos en el panel, córrelo otra vez.
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')
const { put } = require('@vercel/blob')

const fs = require('fs')
const path = require('path')

const TODOS = process.argv.includes('--todos')
// Respaldo: URLs sacadas desde un navegador (Instagram a veces no le
// contesta completo a un script). Caducan en unos días.
const RESPALDO = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'reels-urls.json'), 'utf8')) } catch { return {} }
})()
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

const parse = (url = '') => {
  const m = String(url).match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i)
  return m ? { kind: m[1].toLowerCase() === 'p' ? 'p' : 'reel', code: m[2] } : null
}

// Las URLs vienen escapadas dentro de un JSON dentro del HTML.
const limpiarUrl = (u) => u.replace(/\\+u0026/g, '&').replace(/\\+\//g, '/').replace(/\\/g, '')

function decodificar(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
}

async function leerReel({ kind, code }) {
  const res = await fetch(`https://www.instagram.com/${kind}/${code}/embed/captioned/`, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-MX,es;q=0.9',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Upgrade-Insecure-Requests': '1',
    },
  })
  if (!res.ok) throw new Error(`Instagram respondió ${res.status}`)
  const html = await res.text()
  const v = html.match(/video_url\\*":\\*"(https:[^"]+?)\\*"/)
  const d = html.match(/display_url\\*":\\*"(https:[^"]+?)\\*"/)
  const img = html.match(/class="EmbeddedMediaImage"[^>]*?src="([^"]+)"/)
  let caption = ''
  const cap = html.match(/class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments"/)
  if (cap) {
    caption = decodificar(cap[1].replace(/<a class="CaptionUsername"[\s\S]*?<\/a>/, '')).replace(/\n{3,}/g, '\n\n').trim()
  }
  return {
    video: v ? limpiarUrl(v[1]) : '',
    portada: d ? limpiarUrl(d[1]) : img ? decodificar(img[1]) : '',
    caption,
  }
}

async function bajar(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`descarga ${r.status}`)
  return Buffer.from(await r.arrayBuffer())
}

async function subir(ruta, buffer, contentType) {
  const b = await put(ruta, buffer, {
    access: 'public', contentType, addRandomSuffix: false, allowOverwrite: true,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })
  return b.url
}

async function main() {
  if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI en .env.local'); process.exit(1) }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('Falta BLOB_READ_WRITE_TOKEN en .env.local (Vercel → Storage → tu Blob store → pestaña .env.local).')
    process.exit(1)
  }
  await mongoose.connect(process.env.MONGODB_URI)
  const col = mongoose.connection.db.collection('homesections')
  const secciones = await col.find({ type: 'reels' }).toArray()
  if (!secciones.length) { console.log('No hay bloque "Contenido reciente". Corre antes: node scripts/agregar-reels.js'); return }

  let listos = 0, fallas = 0
  for (const sec of secciones) {
    const items = sec.items || []
    for (const it of items) {
      const ig = parse(it.href)
      if (!ig) continue
      if (!TODOS && it.videoUrl && it.image) continue
      process.stdout.write(`• ${ig.code} … `)
      try {
        let d = {}
        try { d = await leerReel(ig) } catch { d = {} }
        const r = RESPALDO[ig.code] || {}
        d.video = d.video || r.video || ''
        d.portada = d.portada || r.portada || ''
        if (!d.video && !d.portada) throw new Error('Instagram no dio el video ni la portada')
        if (d.portada) it.image = await subir(`portada/reels/${ig.code}.jpg`, await bajar(d.portada), 'image/jpeg')
        if (d.video) it.videoUrl = await subir(`portada/reels/${ig.code}.mp4`, await bajar(d.video), 'video/mp4')
        if (!String(it.text || '').trim() && d.caption) it.text = d.caption
        console.log(`ok${d.video ? ' (video + portada)' : ' (solo portada)'}`)
        listos++
      } catch (e) {
        console.log(`falló: ${e.message}`)
        fallas++
      }
    }
    await col.updateOne({ _id: sec._id }, { $set: { items, updatedAt: new Date() } })
  }
  console.log(`\nListo: ${listos} reels actualizados${fallas ? `, ${fallas} fallaron` : ''}. Recarga cristasur.com.`)
  await mongoose.disconnect()
}

main().catch((e) => { console.error('Falló:', e.message); process.exit(1) })
