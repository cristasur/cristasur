// ============================================================
// CRISTASUR — Subir producto a MongoDB + Vercel Blob
// Uso: node add-product.js
// ============================================================
// Este archivo es generado por el agente. Edita PRODUCT_DATA
// y luego corre: node add-product.js
// ============================================================

const fs   = require('fs')
const path = require('path')

// ─── CONFIG ──────────────────────────────────────────────────
const MONGODB_URI    = 'mongodb+srv://Amir:Amirhefa171819@cluster0.tz4uusc.mongodb.net/cristasur?retryWrites=true&w=majority&appName=Cluster0'
const BLOB_TOKEN     = 'vercel_blob_rw_TleedtX96T6HhsSD_IUu8CX1HsZwKli4aDHbyRglMHeQ11K'
// ─────────────────────────────────────────────────────────────

// ─── PRODUCTO (el agente llena esto por ti) ──────────────────
const PRODUCT_DATA = {
  imagePath:      '',          // ruta a la imagen, ej: './foto.jpg'
  name:           '',
  description:    '',
  price:          0,
  comparePrice:   null,        // precio tachado (null = sin descuento)
  wholesalePrice: null,        // precio mayoreo (null = no aplica)
  wholesaleMinQty: null,       // mínimo piezas para mayoreo
  categorySlug:   '',          // slug de la categoría, ej: 'plasticos'
  sku:            '',          // dejar vacío para auto-generar
  featured:       false,
  tags:           [],          // ej: ['hogar', 'cocina']
}
// ─────────────────────────────────────────────────────────────

async function run() {
  // 1. Validaciones básicas
  if (!PRODUCT_DATA.imagePath) throw new Error('Falta imagePath')
  if (!PRODUCT_DATA.name)      throw new Error('Falta name')
  if (!PRODUCT_DATA.price)     throw new Error('Falta price')
  if (!PRODUCT_DATA.categorySlug) throw new Error('Falta categorySlug')

  const imgPath = path.resolve(PRODUCT_DATA.imagePath)
  if (!fs.existsSync(imgPath)) throw new Error(`Imagen no encontrada: ${imgPath}`)

  // 2. Subir imagen a Vercel Blob
  console.log('📤 Subiendo imagen a Vercel Blob...')
  const ext      = path.extname(imgPath).toLowerCase()
  const mime     = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const filename = `products/${Date.now()}${ext}`
  const imgData  = fs.readFileSync(imgPath)

  const blobRes = await fetch(`https://blob.vercel-storage.com/${filename}`, {
    method: 'PUT',
    headers: {
      Authorization:  `Bearer ${BLOB_TOKEN}`,
      'content-type': mime,
      'x-api-version': '7',
    },
    body: imgData,
  })
  if (!blobRes.ok) {
    const txt = await blobRes.text()
    throw new Error(`Blob error ${blobRes.status}: ${txt}`)
  }
  const { url: imageUrl } = await blobRes.json()
  console.log('✅ Imagen subida:', imageUrl)

  // 3. Conectar a MongoDB
  console.log('🔌 Conectando a MongoDB...')
  const mongoose = require('./node_modules/mongoose')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado')

  // 4. Buscar categoría
  const Category = mongoose.models.Category ||
    mongoose.model('Category', new mongoose.Schema({ name: String, slug: String, active: Boolean }))
  const cat = await Category.findOne({ slug: PRODUCT_DATA.categorySlug }).lean()
  if (!cat) {
    // listar categorías disponibles
    const all = await Category.find({ active: true }).select('name slug').lean()
    console.log('\nCategorías disponibles:')
    all.forEach(c => console.log(` - ${c.slug}  (${c.name})`))
    throw new Error(`Categoría "${PRODUCT_DATA.categorySlug}" no encontrada`)
  }
  console.log('✅ Categoría:', cat.name)

  // 5. Crear producto
  const ProductSchema = new mongoose.Schema({
    name: String, description: String, price: Number,
    comparePrice: Number, wholesalePrice: Number, wholesaleMinQty: Number,
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    image: String, gallery: [String], videoUrl: String,
    featured: Boolean, stock: Number, active: Boolean,
    sku: String, status: String, tags: [String],
    deleted: Boolean, viewsCount: Number, whatsappClicks: Number, salesCount: Number,
    editHistory: [mongoose.Schema.Types.Mixed],
  }, { timestamps: true })
  const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema)

  const sku = PRODUCT_DATA.sku ||
    `CRIS-${Date.now().toString(36).toUpperCase()}`

  const product = await Product.create({
    name:           PRODUCT_DATA.name,
    description:    PRODUCT_DATA.description,
    price:          PRODUCT_DATA.price,
    comparePrice:   PRODUCT_DATA.comparePrice   || null,
    wholesalePrice: PRODUCT_DATA.wholesalePrice  || null,
    wholesaleMinQty:PRODUCT_DATA.wholesaleMinQty || null,
    categories:     [cat._id],
    image:          imageUrl,
    gallery:        [],
    videoUrl:       '',
    featured:       PRODUCT_DATA.featured || false,
    stock:          null,
    active:         true,
    sku,
    status:         'published',
    tags:           PRODUCT_DATA.tags || [],
    deleted:        false,
    viewsCount:     0,
    whatsappClicks: 0,
    salesCount:     0,
    editHistory: [{
      at: new Date(),
      action: 'create',
      changes: `Creado por agente. Precio: $${PRODUCT_DATA.price}`,
    }],
  })

  console.log('\n🎉 ¡Producto creado!')
  console.log('   ID:     ', product._id.toString())
  console.log('   Nombre: ', product.name)
  console.log('   Precio: $', product.price)
  console.log('   SKU:    ', product.sku)
  console.log('   URL:    ', `https://cristasur.com/productos/${product._id}`)

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
