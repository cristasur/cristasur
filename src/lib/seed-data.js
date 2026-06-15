// ============================================================
// src/lib/seed-data.js
// Datos iniciales para CRISTASUR (categorías, productos y admin).
// Se usan tanto desde POST /api/seed como desde scripts/seed.js.
// ============================================================
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import User from '@/models/User'

const CATEGORIES = [
  { name: 'Hogar',       icon: '🏠', order: 1, description: 'Todo para tu casa: organización, cocina y limpieza.' },
  { name: 'Restaurante', icon: '🍽️', order: 2, description: 'Artículos resistentes y económicos para tu negocio.' },
  { name: 'Juguetes',    icon: '🧸', order: 3, description: 'Diversión segura para los más pequeños.' },
  { name: 'Plásticos',   icon: '🪣', order: 4, description: 'Cubetas, recipientes, contenedores y más.' },
  { name: 'Mesas y sillas', icon: '🪑', order: 5, description: 'Mobiliario económico para eventos y hogar.' },
  { name: 'Desechables', icon: '🥤', order: 6, description: 'Platos, vasos y cubiertos desechables por mayoreo.' },
]

// Catálogo de ejemplo; usa Unsplash para las imágenes iniciales
const PRODUCTS = [
  // Hogar
  { name: 'Set de 5 recipientes herméticos',
    description: 'Recipientes de plástico libres de BPA, apilables y aptos para microondas y refrigerador.',
    price: 189, comparePrice: 240, image: 'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800',
    category: 'Hogar', featured: true, stock: 40 },
  { name: 'Organizador multiusos 3 niveles',
    description: 'Organizador de escritorio, baño o cocina con 3 compartimentos resistentes.',
    price: 149, image: 'https://images.unsplash.com/photo-1585771273272-3bb6baadb9f6?w=800',
    category: 'Hogar', stock: 25 },
  { name: 'Escurridor de trastes plegable',
    description: 'Se pliega para ahorrar espacio. Ideal para cocinas pequeñas.',
    price: 229, image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800',
    category: 'Hogar', featured: true, stock: 30 },

  // Restaurante
  { name: 'Jarra de 2L para agua fresca',
    description: 'Jarra de plástico resistente con tapa y vertedor antigoteo. Ideal para restaurantes y negocios.',
    price: 99, image: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800',
    category: 'Restaurante', stock: 80 },
  { name: 'Charola rectangular antideslizante',
    description: 'Charola de servicio con superficie antideslizante. 42x32 cm.',
    price: 135, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800',
    category: 'Restaurante', featured: true, stock: 50 },
  { name: 'Salsero de mesa x6',
    description: 'Set de 6 salseros transparentes con tapa, ideales para salsas y aderezos.',
    price: 79, image: 'https://images.unsplash.com/photo-1609501676725-7186f017a4b7?w=800',
    category: 'Restaurante', stock: 60 },

  // Juguetes
  { name: 'Pelota saltarina grande',
    description: 'Pelota de hule resistente, colores vivos. Perfecta para fiestas y recreo.',
    price: 59, image: 'https://images.unsplash.com/photo-1521417531039-75e91486b998?w=800',
    category: 'Juguetes', stock: 100 },
  { name: 'Set de cocinita infantil 25 pzas',
    description: 'Cocinita de juguete con utensilios, platos y alimentos de plástico.',
    price: 349, comparePrice: 420, image: 'https://images.unsplash.com/photo-1558877385-8c1b8b28d78c?w=800',
    category: 'Juguetes', featured: true, stock: 15 },
  { name: 'Bloques de construcción 80 pzas',
    description: 'Bloques compatibles, coloridos y seguros para mayores de 3 años.',
    price: 219, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
    category: 'Juguetes', stock: 35 },

  // Plásticos
  { name: 'Cubeta industrial 19L',
    description: 'Cubeta de polietileno de alta densidad. Uso rudo.',
    price: 95, image: 'https://images.unsplash.com/photo-1611587671554-f7b97ec0b93b?w=800',
    category: 'Plásticos', stock: 120 },
  { name: 'Contenedor 120L con ruedas',
    description: 'Contenedor con tapa y ruedas. Ideal para almacenamiento o traslado.',
    price: 599, image: 'https://images.unsplash.com/photo-1610478920392-95888b8c68a2?w=800',
    category: 'Plásticos', featured: true, stock: 10 },
  { name: 'Tinaco portátil 40L',
    description: 'Depósito de agua con tapa hermética y asas reforzadas.',
    price: 249, image: 'https://images.unsplash.com/photo-1604335398485-a41b5c2e2cd8?w=800',
    category: 'Plásticos', stock: 22 },

  // Mesas y sillas
  { name: 'Silla plegable adulto',
    description: 'Silla de plástico inyectado con estructura reforzada. Soporta 120 kg.',
    price: 179, image: 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=800',
    category: 'Mesas y sillas', featured: true, stock: 75 },
  { name: 'Mesa cuadrada 80x80 cm',
    description: 'Mesa de plástico con refuerzo metálico, ideal para eventos.',
    price: 799, image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800',
    category: 'Mesas y sillas', stock: 20 },

  // Desechables
  { name: 'Platos desechables #9 x100',
    description: 'Paquete de 100 platos de foam blancos. Ideales para fiestas y eventos.',
    price: 129, image: 'https://images.unsplash.com/photo-1625944230945-1b7dd3b949ab?w=800',
    category: 'Desechables', stock: 200 },
  { name: 'Vasos desechables 12 oz x50',
    description: 'Vasos transparentes resistentes. Pack de 50.',
    price: 69, image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800',
    category: 'Desechables', featured: true, stock: 180 },
  { name: 'Cubiertos desechables x100',
    description: 'Mezcla de tenedores, cucharas y cuchillos. Pack de 100.',
    price: 59, image: 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=800',
    category: 'Desechables', stock: 150 },
]

export async function runSeed({ reset = false } = {}) {
  await dbConnect()

  // Si reset=true borramos colecciones (no usuarios)
  if (reset) {
    await Category.deleteMany({})
    await Product.deleteMany({})
  }

  // ---- Categorías ----
  const catByName = {}
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { name: c.name },
      { $setOnInsert: c },
      { upsert: true, new: true }
    )
    catByName[c.name] = doc._id
  }

  // ---- Productos ----
  let created = 0
  for (const p of PRODUCTS) {
    const exists = await Product.findOne({ name: p.name })
    if (exists) continue
    const { category, ...rest } = p
    await Product.create({ ...rest, categories: [catByName[category]] })
    created += 1
  }

  // ---- Admin ----
  // No usar defaults aquí: si falta la env var, fallamos en vez de crear un admin
  // con credenciales predecibles (el código es público en GitHub).
  const email = process.env.SEED_ADMIN_EMAIL
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error(
      'Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD en el entorno. Definilos antes de correr el seed.'
    )
  }
  if (password.length < 10) {
    throw new Error('SEED_ADMIN_PASSWORD debe tener al menos 10 caracteres.')
  }
  let admin = await User.findOne({ email })
  if (!admin) {
    admin = await User.createWithPassword({ email, password, name: 'Admin CRISTASUR' })
  }

  return {
    categories: Object.keys(catByName).length,
    productsCreated: created,
    adminEmail: admin.email,
  }
}
