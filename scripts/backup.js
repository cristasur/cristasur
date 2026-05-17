#!/usr/bin/env node
// ============================================================
// scripts/backup.js
// Exporta a /backups/<YYYY-MM-DD-HHmm>/ :
//  - cada colección como JSON (products, categories, coupons, reviews, users, orders)
//  - el catálogo de productos como CSV (con _id para round-trip)
//  - un .tar.gz con el contenido de public/uploads
// Uso:
//   npm run backup
// Cron sugerido (Linux/macOS):
//   0 2 * * *  cd /ruta/cristasur && /usr/bin/node scripts/backup.js >> /var/log/cristasur-backup.log 2>&1
// ============================================================
require('dotenv').config({ path: '.env.local' })
const path = require('path')
const fs = require('fs')
const fsp = require('fs/promises')
const { spawn } = require('child_process')
const mongoose = require('mongoose')

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Falta MONGODB_URI en .env.local')
    process.exit(1)
  }
  await mongoose.connect(uri)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16) // YYYY-MM-DDTHH-MM
  const backupRoot = path.join(process.cwd(), 'backups', stamp)
  await fsp.mkdir(backupRoot, { recursive: true })

  const collections = ['products', 'categories', 'coupons', 'reviews', 'users', 'orders']
  const db = mongoose.connection.db

  const summary = []
  for (const col of collections) {
    try {
      const docs = await db.collection(col).find({}).toArray()
      const file = path.join(backupRoot, `${col}.json`)
      await fsp.writeFile(file, JSON.stringify(docs, null, 2), 'utf8')
      summary.push(`  ${col}: ${docs.length} docs → ${file}`)
    } catch (e) {
      summary.push(`  ${col}: ERROR ${e.message}`)
    }
  }

  // CSV de productos para round-trip humano (Excel-friendly)
  try {
    const products = await db.collection('products').find({}).toArray()
    const cols = [
      '_id', 'name', 'description', 'price', 'comparePrice',
      'wholesalePrice', 'wholesaleMinQty', 'stock', 'sku',
      'featured', 'active', 'image', 'gallery', 'tags',
      'createdAt', 'updatedAt',
    ]
    const escape = (v) => {
      if (v == null) return ''
      const s = Array.isArray(v) ? v.join('|') : String(v)
      return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = products.map((p) =>
      cols
        .map((c) => {
          if (c === '_id') return String(p._id)
          if (c === 'tags' && Array.isArray(p.tags)) return p.tags.join('|')
          if (c === 'gallery' && Array.isArray(p.gallery)) return p.gallery.join('|')
          return p[c] ?? ''
        })
        .map(escape)
        .join(',')
    )
    const csv = '﻿' + cols.join(',') + '\n' + rows.join('\n') + '\n'
    const csvFile = path.join(backupRoot, 'products.csv')
    await fsp.writeFile(csvFile, csv, 'utf8')
    summary.push(`  products.csv → ${csvFile}`)
  } catch (e) {
    summary.push(`  products.csv: ERROR ${e.message}`)
  }

  // tar.gz de public/uploads
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (fs.existsSync(uploadsDir)) {
    try {
      await new Promise((resolve, reject) => {
        const out = path.join(backupRoot, 'uploads.tar.gz')
        const child = spawn('tar', ['-czf', out, '-C', path.join(process.cwd(), 'public'), 'uploads'])
        child.on('close', (code) => {
          if (code === 0) {
            summary.push(`  uploads.tar.gz → ${out}`)
            resolve()
          } else reject(new Error(`tar exit ${code}`))
        })
        child.on('error', reject)
      })
    } catch (e) {
      summary.push(`  uploads.tar.gz: ERROR ${e.message}`)
    }
  } else {
    summary.push('  uploads.tar.gz: omitido (no existe public/uploads)')
  }

  // Limpieza: borra backups con > 30 días
  try {
    const root = path.join(process.cwd(), 'backups')
    const entries = await fsp.readdir(root, { withFileTypes: true })
    const cutoff = Date.now() - 30 * 24 * 3600 * 1000
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const dirPath = path.join(root, e.name)
      const stat = await fsp.stat(dirPath)
      if (stat.mtimeMs < cutoff) {
        await fsp.rm(dirPath, { recursive: true, force: true })
        summary.push(`  cleanup: borrado ${e.name}`)
      }
    }
  } catch (e) {
    summary.push(`  cleanup: ERROR ${e.message}`)
  }

  console.log(`Backup ${stamp} completado:`)
  console.log(summary.join('\n'))

  await mongoose.disconnect()
}

main().catch((e) => {
  console.error('Backup falló:', e)
  process.exit(1)
})
