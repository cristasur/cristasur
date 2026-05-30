// ============================================================
// scripts/fix-products-status.js
// Corrige el estado de los productos existentes en la base de datos:
//   - Sin imagen -> status = 'draft' (borrador)
//   - Con imagen -> status = 'published' (catálogo normal / admin general)
//   * Conserva el campo 'active' tal como esté para respetar la visibilidad pública.
//
// Uso: node scripts/fix-products-status.js
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
  console.log('✓ Conectado exitosamente')

  // Schema mínimo para la operación
  const ProductSchema = new mongoose.Schema(
    {
      name: String,
      image: { type: String, default: '' },
      status: { type: String, enum: ['draft', 'published'] },
      deleted: { type: Boolean, default: false }
    },
    { strict: false }
  )

  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

  // 1. Productos sin imagen -> status = 'draft'
  const noImageQuery = {
    deleted: { $ne: true },
    $or: [
      { image: { $exists: false } },
      { image: null },
      { image: '' },
      { image: /^\s*$/ } // solo espacios en blanco
    ]
  }

  console.log('→ Buscando productos sin imagen...')
  const noImageCount = await Product.countDocuments(noImageQuery)
  console.log(`Encontrados ${noImageCount} productos sin imagen activa.`)

  if (noImageCount > 0) {
    const noImageRes = await Product.updateMany(noImageQuery, {
      $set: { status: 'draft' }
    })
    console.log(`✓ ${noImageRes.modifiedCount} productos actualizados a estado 'draft' (Borradores).`)
  } else {
    console.log('✓ Ningún producto requiere actualizar a ' + "'draft'.")
  }

  // 2. Productos con imagen -> status = 'published'
  const withImageQuery = {
    deleted: { $ne: true },
    image: { $exists: true, $ne: null, $regex: /\S/ } // contiene al menos un carácter que no sea espacio
  }

  console.log('→ Buscando productos con imagen...')
  const withImageCount = await Product.countDocuments(withImageQuery)
  console.log(`Encontrados ${withImageCount} productos con imagen activa.`)

  if (withImageCount > 0) {
    const withImageRes = await Product.updateMany(withImageQuery, {
      $set: { status: 'published' }
    })
    console.log(`✓ ${withImageRes.modifiedCount} productos actualizados a estado 'published' (Lista Normal).`)
  } else {
    console.log('✓ Ningún producto requiere actualizar a ' + "'published'.")
  }

  await mongoose.disconnect()
  console.log('✅ Proceso de migración finalizado correctamente.')
}

main().catch((err) => {
  console.error('❌ Error en la ejecución de la migración:', err)
  process.exit(1)
})
