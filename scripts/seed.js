// ============================================================
// scripts/seed.js
// Script offline para poblar la DB sin necesidad de arrancar Next.
// Uso:   npm run seed
//        npm run seed -- --reset    (elimina productos y categorías antes)
// ============================================================
require('dotenv').config({ path: '.env.local' })

async function main() {
  // Usamos require dinámico para poder cargar .env primero
  const reset = process.argv.includes('--reset')

  // Cargar modelos directamente (sin next)
  const mongoose = require('mongoose')
  const bcrypt = require('bcryptjs')

  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ Falta MONGODB_URI en .env.local')
    process.exit(1)
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET debe tener al menos 32 caracteres en .env.local')
    process.exit(1)
  }

  console.log('→ Conectando a MongoDB...')
  await mongoose.connect(uri)
  console.log('✓ Conectado')

  // Schemas mínimos inline (equivalentes a los de src/models/*)
  const CategorySchema = new mongoose.Schema(
    {
      name: { type: String, required: true, unique: true, trim: true },
      slug: { type: String, unique: true },
      description: { type: String, default: '' },
      icon: { type: String, default: '📦' },
      order: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
  CategorySchema.pre('validate', function (next) {
    if (this.name && !this.slug) {
      this.slug = this.name
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
    }
    next()
  })

  const ProductSchema = new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      description: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      comparePrice: { type: Number, default: null },
      category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
      image: { type: String, default: '' },
      gallery: [String],
      featured: { type: Boolean, default: false },
      stock: { type: Number, default: 0 },
      active: { type: Boolean, default: true },
      sku: { type: String, sparse: true, unique: true },
    },
    { timestamps: true }
  )

  const UserSchema = new mongoose.Schema(
    {
      email: { type: String, required: true, unique: true, lowercase: true },
      passwordHash: { type: String, required: true },
      name: { type: String, default: 'Administrador' },
      role: { type: String, default: 'admin' },
    },
    { timestamps: true }
  )

  const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema)
  const Product  = mongoose.models.Product  || mongoose.model('Product',  ProductSchema)
  const User     = mongoose.models.User     || mongoose.model('User',     UserSchema)

  if (reset) {
    console.log('⚠️  --reset: eliminando productos y categorías existentes')
    await Product.deleteMany({})
    await Category.deleteMany({})
  }

  const CATEGORIES = [
    { name: 'Hogar',          icon: '🏠', order: 1, description: 'Todo para tu casa.' },
    { name: 'Restaurante',    icon: '🍽️', order: 2, description: 'Resistente y económico para tu negocio.' },
    { name: 'Juguetes',       icon: '🧸', order: 3, description: 'Diversión segura para los más pequeños.' },
    { name: 'Plásticos',      icon: '🪣', order: 4, description: 'Cubetas, recipientes, contenedores.' },
    { name: 'Mesas y sillas', icon: '🪑', order: 5, description: 'Mobiliario para eventos y hogar.' },
    { name: 'Desechables',    icon: '🥤', order: 6, description: 'Platos, vasos y cubiertos por mayoreo.' },
  ]

  const catByName = {}
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { name: c.name },
      { $setOnInsert: c },
      { upsert: true, new: true }
    )
    catByName[c.name] = doc._id
  }
  console.log(`✓ ${CATEGORIES.length} categorías listas`)

  const PRODUCTS = [
    { name: 'Set de 5 recipientes herméticos', description: 'Recipientes de plástico libres de BPA, apilables y aptos para microondas y refrigerador.', price: 189, comparePrice: 240, image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800', category: 'Hogar', featured: true, stock: 40 },
    { name: 'Organizador multiusos 3 niveles',  description: 'Organizador con 3 compartimentos resistentes.', price: 149, image: 'https://images.unsplash.com/photo-1585771273272-3bb6baadb9f6?w=800', category: 'Hogar', stock: 25 },
    { name: 'Escurridor de trastes plegable',   description: 'Se pliega para ahorrar espacio.', price: 229, image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', category: 'Hogar', featured: true, stock: 30 },
    { name: 'Jarra de 2L para agua fresca',     description: 'Resistente con tapa y vertedor antigoteo.', price: 99, image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800', category: 'Restaurante', stock: 80 },
    { name: 'Charola rectangular antideslizante', description: '42x32 cm, ideal para servicio.', price: 135, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800', category: 'Restaurante', featured: true, stock: 50 },
    { name: 'Salsero de mesa x6',               description: 'Set de 6 salseros transparentes con tapa.', price: 79, image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=800', category: 'Restaurante', stock: 60 },
    { name: 'Pelota saltarina grande',          description: 'Pelota de hule resistente.', price: 59, image: 'https://images.unsplash.com/photo-1521417531039-75e91486b998?w=800', category: 'Juguetes', stock: 100 },
    { name: 'Set de cocinita infantil 25 pzas', description: 'Cocinita de juguete con utensilios.', price: 349, comparePrice: 420, image: 'https://images.unsplash.com/photo-1558877385-8c1b8b28d78c?w=800', category: 'Juguetes', featured: true, stock: 15 },
    { name: 'Bloques de construcción 80 pzas',  description: 'Bloques compatibles y seguros.', price: 219, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800', category: 'Juguetes', stock: 35 },
    { name: 'Cubeta industrial 19L',            description: 'Polietileno de alta densidad.', price: 95,  image: 'https://images.unsplash.com/photo-1611587671554-f7b97ec0b93b?w=800', category: 'Plásticos', stock: 120 },
    { name: 'Contenedor 120L con ruedas',       description: 'Con tapa y ruedas.', price: 599, image: 'https://images.unsplash.com/photo-1610478920392-95888b8c68a2?w=800', category: 'Plásticos', featured: true, stock: 10 },
    { name: 'Tinaco portátil 40L',              description: 'Depósito con tapa hermética.', price: 249, image: 'https://images.unsplash.com/photo-1604335398485-a41b5c2e2cd8?w=800', category: 'Plásticos', stock: 22 },
    { name: 'Silla plegable adulto',            description: 'Soporta 120 kg.', price: 179, image: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800', category: 'Mesas y sillas', featured: true, stock: 75 },
    { name: 'Mesa cuadrada 80x80 cm',           description: 'Refuerzo metálico.', price: 799, image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800', category: 'Mesas y sillas', stock: 20 },
    { name: 'Platos desechables #9 x100',       description: 'Paquete de 100.', price: 129, image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800', category: 'Desechables', stock: 200 },
    { name: 'Vasos desechables 12oz x50',       description: 'Transparentes resistentes.', price: 69,  image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800', category: 'Desechables', featured: true, stock: 180 },
    { name: 'Cubiertos desechables x100',       description: 'Mezcla de 100 pzas.', price: 59,  image: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800', category: 'Desechables', stock: 150 },
  ]

  let created = 0
  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ name: p.name })
    if (exists) continue
    await Product.create({ ...p, category: catByName[p.category] })
    created += 1
  }
  console.log(`✓ ${created} productos nuevos`)

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@cristasur.mx'
  const password = process.env.SEED_ADMIN_PASSWORD || 'Cristasur2026!'
  let admin = await User.findOne({ email })
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 12)
    admin = await User.create({ email, passwordHash, name: 'Admin CRISTASUR', role: 'admin' })
    console.log(`✓ Admin creado: ${email} / ${password}`)
  } else {
    console.log(`✓ Admin ya existía: ${email}`)
  }

  await mongoose.disconnect()
  console.log('✅ Seed completo')
}

main().catch((err) => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
