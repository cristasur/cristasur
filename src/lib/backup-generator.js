// ============================================================
// src/lib/backup-generator.js
// Genera archivos de backup EN MEMORIA (buffers) sin escribir a
// filesystem. Se usa tanto desde el endpoint de cron como desde
// el script local scripts/backup.js. Devuelve una lista de
// { name, buffer, contentType } listos para subir a R2.
// ============================================================
import dbConnect from './mongodb.js'
import mongoose from 'mongoose'

const COLLECTIONS = [
  'products',
  'categories',
  'coupons',
  'reviews',
  'users',
  'orders',
  'brands',
  'materials',
  'banners',
  'newsletters',
  'posts',
  'presences', // opcional; muy volátil, útil para debug si algo raro pasa
]

function nowStamp() {
  // 2026-09-20T03-00 (safe para nombres de carpeta)
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16)
}

function csvEscape(v) {
  if (v == null) return ''
  const s = Array.isArray(v) ? v.join('|') : String(v)
  return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Genera todos los archivos del backup en memoria.
 * @returns {Promise<{stamp: string, files: Array<{name: string, buffer: Buffer, contentType: string}>, summary: Array<string>}>}
 */
export async function generateBackup() {
  await dbConnect()
  const db = mongoose.connection.db
  const stamp = nowStamp()
  const files = []
  const summary = []

  // 1) Un JSON por colección
  for (const col of COLLECTIONS) {
    try {
      const docs = await db.collection(col).find({}).toArray()
      const buffer = Buffer.from(JSON.stringify(docs, null, 2), 'utf8')
      files.push({
        name: `${col}.json`,
        buffer,
        contentType: 'application/json',
      })
      summary.push(`  ${col}: ${docs.length} docs (${(buffer.length / 1024).toFixed(1)} KB)`)
    } catch (e) {
      summary.push(`  ${col}: SKIP (${e.message})`)
    }
  }

  // 2) CSV amigable de productos para restore manual desde Excel
  try {
    const products = await db.collection('products').find({}).toArray()
    const cols = [
      '_id', 'name', 'description', 'price', 'comparePrice',
      'wholesalePrice', 'wholesaleMinQty', 'stock', 'sku',
      'featured', 'active', 'image', 'gallery', 'tags',
      'status', 'createdAt', 'updatedAt',
    ]
    const rows = products.map((p) =>
      cols
        .map((c) => {
          if (c === '_id') return String(p._id)
          if ((c === 'tags' || c === 'gallery') && Array.isArray(p[c])) {
            return p[c].join('|')
          }
          return p[c] ?? ''
        })
        .map(csvEscape)
        .join(',')
    )
    // BOM al inicio para que Excel abra bien los acentos
    const csv = '﻿' + cols.join(',') + '\n' + rows.join('\n') + '\n'
    const buffer = Buffer.from(csv, 'utf8')
    files.push({
      name: 'products.csv',
      buffer,
      contentType: 'text/csv; charset=utf-8',
    })
    summary.push(`  products.csv: ${products.length} filas (${(buffer.length / 1024).toFixed(1)} KB)`)
  } catch (e) {
    summary.push(`  products.csv: SKIP (${e.message})`)
  }

  // 3) Metadata del backup (útil para saber cuándo y con qué versión se generó)
  const meta = {
    stamp,
    generatedAt: new Date().toISOString(),
    node: process.version,
    collections: files.filter((f) => f.name.endsWith('.json')).map((f) => f.name.replace('.json', '')),
  }
  files.push({
    name: '_meta.json',
    buffer: Buffer.from(JSON.stringify(meta, null, 2), 'utf8'),
    contentType: 'application/json',
  })

  return { stamp, files, summary }
}
