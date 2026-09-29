/* ============================================================
 * Migra imágenes alojadas en servicios externos (ImgBB, Imgur,
 * Postimages…) a Vercel Blob.
 *
 * POR QUÉ: las categorías tenían sus fotos en i.ibb.co, un host
 * gratuito que limita las peticiones. Resultado: unas cargaban y
 * otras no, y cambiaba en cada recarga. Los círculos salían vacíos
 * sin que el código tuviera nada malo.
 *
 * Vercel Blob es el almacenamiento que ya usa /api/upload, está
 * pagado dentro de tu plan y no tiene ese límite.
 *
 * USO:
 *   node scripts/migrate-images-to-blob.js            (simulación)
 *   node scripts/migrate-images-to-blob.js --apply    (escribe)
 *
 * Requiere en .env.local:
 *   MONGODB_URI
 *   BLOB_READ_WRITE_TOKEN
 * ============================================================ */
require('dotenv').config({ path: '.env.local' })

const mongoose = require('mongoose')
const { put } = require('@vercel/blob')

const APPLY = process.argv.includes('--apply')

// Dominios que SÍ son nuestros: no se tocan.
const SAFE_HOSTS = [/\.blob\.vercel-storage\.com$/i]

// Solo migramos http(s) externos. Las rutas relativas (/uploads/...)
// viven en el repo y funcionan bien.
function needsMigration(url) {
  if (!url || typeof url !== 'string') return false
  if (!/^https?:\/\//i.test(url)) return false
  let host
  try { host = new URL(url).host } catch { return false }
  return !SAFE_HOSTS.some((re) => re.test(host))
}

async function download(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    headers: { 'User-Agent': 'Mozilla/5.0 (CRISTASUR migracion)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const type = res.headers.get('content-type') || 'image/jpeg'
  if (!type.startsWith('image/')) throw new Error(`No es imagen: ${type}`)
  return { buffer: Buffer.from(await res.arrayBuffer()), type }
}

function extFor(type) {
  if (type.includes('png')) return '.png'
  if (type.includes('webp')) return '.webp'
  if (type.includes('gif')) return '.gif'
  return '.jpg'
}

async function migrateUrl(url, folder) {
  const { buffer, type } = await download(url)
  const name = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2, 10)}${extFor(type)}`
  const blob = await put(name, buffer, { access: 'public', contentType: type })
  return { url: blob.url, kb: Math.round(buffer.length / 1024) }
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Falta MONGODB_URI en .env.local')
  if (!APPLY) {
    console.log('\n*** SIMULACIÓN — no se escribe nada. Usa --apply para aplicar. ***\n')
  } else if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('Falta BLOB_READ_WRITE_TOKEN en .env.local')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db

  // colección → campos de imagen a revisar
  const TARGETS = [
    { coll: 'categories', folder: 'categorias', single: ['image'], many: [] },
    { coll: 'banners',    folder: 'banners',    single: ['image'], many: [] },
    { coll: 'products',   folder: 'productos',  single: ['image'], many: ['gallery'] },
    { coll: 'posts',      folder: 'blog',       single: ['image', 'cover'], many: [] },
  ]

  let found = 0, migrated = 0, failed = 0

  for (const t of TARGETS) {
    const exists = await db.listCollections({ name: t.coll }).hasNext()
    if (!exists) continue

    const docs = await db.collection(t.coll).find({}).toArray()

    for (const doc of docs) {
      const updates = {}
      const label = doc.name || doc.title || String(doc._id)

      // Campos de una sola imagen
      for (const field of t.single) {
        if (!needsMigration(doc[field])) continue
        found++
        const host = new URL(doc[field]).host
        if (!APPLY) {
          console.log(`  [simular] ${t.coll}/${label} · ${field} · ${host}`)
          continue
        }
        try {
          const r = await migrateUrl(doc[field], t.folder)
          updates[field] = r.url
          migrated++
          console.log(`  ✓ ${t.coll}/${label} · ${field} · ${host} → Blob (${r.kb} KB)`)
        } catch (e) {
          failed++
          console.log(`  ✗ ${t.coll}/${label} · ${field} · ${host} — ${e.message}`)
        }
      }

      // Campos con arreglo de imágenes
      for (const field of t.many) {
        const arr = Array.isArray(doc[field]) ? doc[field] : []
        if (!arr.some(needsMigration)) continue
        const next = []
        for (const url of arr) {
          if (!needsMigration(url)) { next.push(url); continue }
          found++
          if (!APPLY) {
            console.log(`  [simular] ${t.coll}/${label} · ${field}[] · ${new URL(url).host}`)
            next.push(url)
            continue
          }
          try {
            const r = await migrateUrl(url, t.folder)
            next.push(r.url)
            migrated++
            console.log(`  ✓ ${t.coll}/${label} · ${field}[] → Blob (${r.kb} KB)`)
          } catch (e) {
            failed++
            next.push(url) // se conserva el original si falla
            console.log(`  ✗ ${t.coll}/${label} · ${field}[] — ${e.message}`)
          }
        }
        if (APPLY) updates[field] = next
      }

      if (APPLY && Object.keys(updates).length) {
        await db.collection(t.coll).updateOne({ _id: doc._id }, { $set: updates })
      }
    }
  }

  console.log('\n──────────────────────────────')
  console.log(`Imágenes externas encontradas: ${found}`)
  if (APPLY) {
    console.log(`Migradas a Blob:              ${migrated}`)
    console.log(`Fallidas (sin cambio):        ${failed}`)
  } else {
    console.log('Nada se modificó. Corre con --apply para migrarlas.')
  }
  console.log('──────────────────────────────\n')

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error('\nError:', e.message, '\n')
  process.exit(1)
})
