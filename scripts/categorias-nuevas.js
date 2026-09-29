#!/usr/bin/env node
// ============================================================
// scripts/categorias-nuevas.js
// Deja la barra con las categorías nuevas y quita la categoría a
// TODOS los productos (las subcategorías se agregan a mano después).
//
// Qué hace:
//   1. Respalda categorías, las categorías de cada producto y las
//      referencias a categorías en portada y cupones.
//   2. Quita la categoría a todos los productos (nada más cambia:
//      precios, fotos, variantes, líneas, etc. quedan igual).
//   3. Borra las categorías viejas y deja solo las nuevas, en orden.
//      Si una vieja se llama igual que una nueva (ej. Cocina,
//      Limpieza) se reutiliza y conserva su foto y textos.
//   4. Limpia las referencias a categorías borradas en portada y cupones.
//
// USO:
//   node scripts/categorias-nuevas.js                (solo muestra qué haría)
//   node scripts/categorias-nuevas.js --aplicar
//   node scripts/categorias-nuevas.js --deshacer scripts/respaldos/categorias-XXXX.json
// ============================================================
require('dotenv').config({ path: '.env.local' })
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')

const NUEVAS = [
  'Vajilla',
  'Cristalería',
  'Cocina',
  'Almacenamiento',
  'Termos e hieleras',
  'Desechables',
  'Limpieza',
  'Muebles',
  'Hogar y baño',
  'Para tu negocio',
]

const ARGS = process.argv.slice(2)
const APLICAR = ARGS.includes('--aplicar')
const DESHACER = ARGS.includes('--deshacer') ? ARGS[ARGS.indexOf('--deshacer') + 1] : null

const slug = (s = '') => s.toString().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
const sello = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const LOTE = 500

async function enLotes(col, ops) {
  for (let i = 0; i < ops.length; i += LOTE) {
    await col.bulkWrite(ops.slice(i, i + LOTE), { ordered: false })
    process.stdout.write(`\r  ${Math.min(i + LOTE, ops.length)} / ${ops.length}`)
  }
  if (ops.length) process.stdout.write('\n')
}

async function deshacer(db, archivo) {
  const r = JSON.parse(fs.readFileSync(archivo, 'utf8'))
  const oid = (x) => (x ? new mongoose.Types.ObjectId(String(x)) : null)
  console.log(`Restaurando ${r.categorias.length} categorías y ${r.productos.length} productos…`)

  const cats = db.collection('categories')
  await cats.deleteMany({})
  if (r.categorias.length) {
    await cats.insertMany(r.categorias.map((c) => ({
      ...c, _id: oid(c._id), parent: oid(c.parent),
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
    })))
  }
  await enLotes(db.collection('products'), r.productos.map((p) => ({
    updateOne: { filter: { _id: oid(p._id) }, update: { $set: { categories: p.categories.map(oid) } } },
  })))
  for (const s of r.portada) {
    await db.collection('homesections').updateOne({ _id: oid(s._id) }, {
      $set: { category: oid(s.category), items: s.items.map((it) => ({ ...it, _id: oid(it._id), category: oid(it.category) })) },
    })
  }
  for (const c of r.cupones) {
    await db.collection('coupons').updateOne({ _id: oid(c._id) }, { $set: { categories: c.categories.map(oid) } })
  }
  console.log('Listo: todo quedó como antes.')
}

async function main() {
  if (!process.env.MONGODB_URI) { console.error('Falta MONGODB_URI en .env.local'); process.exit(1) }
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  if (DESHACER) { await deshacer(db, DESHACER); return mongoose.disconnect() }

  const cats = db.collection('categories')
  const prods = db.collection('products')
  const viejas = await cats.find({}).toArray()
  const conCategoria = await prods.find({ 'categories.0': { $exists: true } }, { projection: { categories: 1 } }).toArray()
  const portada = await db.collection('homesections').find({}).toArray()
  const cupones = await db.collection('coupons').find({ 'categories.0': { $exists: true } }).toArray()

  const porSlug = new Map(viejas.map((c) => [c.slug, c]))
  const reusadas = NUEVAS.filter((n) => porSlug.has(slug(n)))
  const idsQueQuedan = new Set(reusadas.map((n) => String(porSlug.get(slug(n))._id)))
  const aBorrar = viejas.filter((c) => !idsQueQuedan.has(String(c._id)))

  console.log(`Categorías actuales: ${viejas.length}`)
  console.log(`Productos con categoría: ${conCategoria.length} → quedarán SIN categoría`)
  console.log(`Se reutilizan: ${reusadas.join(', ') || 'ninguna'}`)
  console.log(`Se borran: ${aBorrar.map((c) => c.name).join(', ') || 'ninguna'}`)
  console.log(`Se crean: ${NUEVAS.filter((n) => !porSlug.has(slug(n))).join(', ') || 'ninguna'}`)
  const bloques = portada.filter((s) => s.category || (s.items || []).some((it) => it.category))
  if (bloques.length) console.log(`Bloques de portada que apuntaban a categorías: ${bloques.map((s) => s.title || s.type).join(', ')}`)
  if (cupones.length) console.log(`Cupones limitados a categorías: ${cupones.map((c) => c.code).join(', ')}`)

  if (!APLICAR) {
    console.log('\nNo se cambió nada. Para aplicarlo:  node scripts/categorias-nuevas.js --aplicar')
    return mongoose.disconnect()
  }

  // 1. Respaldo
  const respaldo = {
    categorias: viejas,
    productos: conCategoria.map((p) => ({ _id: String(p._id), categories: (p.categories || []).map(String) })),
    portada: bloques.map((s) => ({ _id: String(s._id), category: s.category ? String(s.category) : null,
      items: (s.items || []).map((it) => ({ ...it, _id: String(it._id), category: it.category ? String(it.category) : null })) })),
    cupones: cupones.map((c) => ({ _id: String(c._id), categories: (c.categories || []).map(String) })),
  }
  const ruta = path.join(__dirname, 'respaldos', `categorias-${sello()}.json`)
  fs.mkdirSync(path.dirname(ruta), { recursive: true })
  fs.writeFileSync(ruta, JSON.stringify(respaldo))
  console.log(`\nRespaldo: ${path.relative(process.cwd(), ruta)}`)

  // 2. Quitar categoría a todos los productos
  console.log('Quitando categorías a los productos…')
  const r = await prods.updateMany({ 'categories.0': { $exists: true } }, { $set: { categories: [] } })
  console.log(`  ${r.modifiedCount} productos sin categoría`)

  // 3. Categorías: borrar viejas, crear/ordenar nuevas
  if (aBorrar.length) await cats.deleteMany({ _id: { $in: aBorrar.map((c) => c._id) } })
  const ahora = new Date()
  for (const [i, nombre] of NUEVAS.entries()) {
    const s = slug(nombre)
    if (porSlug.has(s)) {
      await cats.updateOne({ slug: s }, { $set: { name: nombre, order: i, parent: null, active: true, updatedAt: ahora } })
    } else {
      await cats.insertOne({
        name: nombre, slug: s, description: '', seoText: '', seoTitle: '', seoDescription: '',
        icon: '', image: '', order: i, active: true, featured: false, bannerColor: '', parent: null,
        createdAt: ahora, updatedAt: ahora,
      })
    }
  }

  // 4. Referencias viejas en portada y cupones
  const borrados = aBorrar.map((c) => c._id)
  await db.collection('homesections').updateMany({ category: { $in: borrados } }, { $set: { category: null } })
  await db.collection('homesections').updateMany({ 'items.category': { $in: borrados } },
    { $set: { 'items.$[it].category': null } }, { arrayFilters: [{ 'it.category': { $in: borrados } }] })
  await db.collection('coupons').updateMany({ categories: { $in: borrados } }, { $pull: { categories: { $in: borrados } } })

  console.log(`\nLISTO: ${NUEVAS.length} categorías nuevas, productos sin categoría.`)
  console.log(`Para deshacer:  node scripts/categorias-nuevas.js --deshacer ${path.relative(process.cwd(), ruta)}`)
  await mongoose.disconnect()
}

main().catch((e) => { console.error('Falló:', e.message); process.exit(1) })
