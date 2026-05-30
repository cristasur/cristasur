// ============================================================
// scripts/analyze-db.js
// Script de diagnóstico para conectarse a MongoDB Atlas y analizar
// los productos con imagen, su estado y posibles SKU duplicados.
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('❌ Falta MONGODB_URI en .env.local')
  process.exit(1)
}

async function main() {
  console.log('→ Conectando a MongoDB Atlas...')
  await mongoose.connect(uri)
  console.log('✓ Conectado')

  const ProductSchema = new mongoose.Schema({}, { strict: false })
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

  // 1. Total productos
  const total = await Product.countDocuments({ deleted: { $ne: true } })
  console.log(`\n=== ESTADÍSTICAS GENERALES ===`)
  console.log(`Total productos (no eliminados): ${total}`)

  // 2. Productos con imagen
  const withImage = await Product.find({
    deleted: { $ne: true },
    image: { $exists: true, $ne: null, $regex: /\S/ }
  }).lean()
  console.log(`Productos con imagen principal: ${withImage.length}`)

  console.log(`\n=== LISTADO DE PRODUCTOS CON IMAGEN ===`)
  for (const p of withImage) {
    console.log(`- ID: ${p._id} | Nombre: "${p.name}" | SKU: ${p.sku || 'SIN SKU'} | Status: '${p.status}' | Active: ${p.active} | Imagen: ${p.image.slice(0, 40)}...`)
  }

  // 3. Buscar posibles duplicados por nombre o SKU
  console.log(`\n=== ANÁLISIS DE DUPLICADOS ===`)
  const skuCounts = {}
  const nameCounts = {}
  for (const p of withImage) {
    if (p.sku) skuCounts[p.sku] = (skuCounts[p.sku] || 0) + 1
    nameCounts[p.name] = (nameCounts[p.name] || 0) + 1
  }

  const dupSkus = Object.entries(skuCounts).filter(([_, count]) => count > 1)
  const dupNames = Object.entries(nameCounts).filter(([_, count]) => count > 1)

  console.log(`SKUs duplicados:`, dupSkus)
  console.log(`Nombres duplicados:`, dupNames)

  // 4. Qué productos están actualmente publicados en la web pública
  console.log(`\n=== PRODUCTOS PÚBLICOS EN LA WEB ===`)
  const now = new Date()
  const publicMatch = {
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  }
  const publicProds = await Product.find(publicMatch).select('name price status active image').lean()
  console.log(`Total productos visibles en la web: ${publicProds.length}`)
  for (const p of publicProds) {
    console.log(`- ID: ${p._id} | Nombre: "${p.name}" | Status: '${p.status}' | Active: ${p.active}`)
  }

  await mongoose.disconnect()
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
