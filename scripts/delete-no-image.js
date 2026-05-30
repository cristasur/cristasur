// ============================================================
// scripts/delete-no-image.js
// Borra de forma permanente todos los productos sin imagen principal.
// Uso: node scripts/delete-no-image.js
// ============================================================
require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('❌ Falta MONGODB_URI en .env.local')
  process.exit(1)
}

async function main() {
  console.log('→ Conectando a la base de datos...')
  await mongoose.connect(uri)
  console.log('✓ Conectado')

  const ProductSchema = new mongoose.Schema({}, { strict: false })
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

  const query = {
    $or: [
      { image: { $exists: false } },
      { image: null },
      { image: '' },
      { image: /^\s*$/ }
    ]
  }

  const count = await Product.countDocuments(query)
  console.log(`→ Encontrados ${count} productos sin imagen principal.`)

  if (count > 0) {
    console.log('→ Eliminando productos...');
    const result = await Product.deleteMany(query)
    console.log(`✅ ¡Éxito! Se eliminaron permanentemente ${result.deletedCount} productos de la base de datos.`)
  } else {
    console.log('✓ No hay productos sin imagen para eliminar.')
  }

  await mongoose.disconnect()
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
