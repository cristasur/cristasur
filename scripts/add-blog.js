// ============================================================
// CRISTASUR — Crear post de blog con video
// Uso: node scripts/add-blog.js
// Requiere que .env.local esté en la raíz del proyecto con:
//   MONGODB_URI y BLOB_WRITE_TOKEN (o BLOB_READ_WRITE_TOKEN)
// ============================================================

const fs   = require('fs')
const path = require('path')

// Cargar variables de entorno desde .env.local (no exponer credenciales en código)
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI
const BLOB_TOKEN  = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_WRITE_TOKEN

if (!MONGODB_URI) throw new Error('Falta MONGODB_URI en .env.local')
if (!BLOB_TOKEN)  throw new Error('Falta BLOB_READ_WRITE_TOKEN en .env.local')

// ─── Ruta al video ────────────────────────────────────────────
// Cambia esta ruta al video que quieras subir
const VIDEO_PATH = process.argv[2] || ''
// ─────────────────────────────────────────────────────────────

function buildContent(videoUrl) {
  return `
<div style="margin-bottom:2rem;">
  <video
    src="${videoUrl}"
    controls
    playsinline
    style="width:100%;border-radius:12px;max-height:520px;background:#000;"
  ></video>
</div>

<p>Si tienes un restaurante, cocina económica, fonda o negocio de alimentos en Yucatán, sabes que equiparlo bien hace toda la diferencia. No se trata solo de que se vea bien — se trata de que dure, que sea práctico y que no te cueste el doble.</p>

<p>En CRISTASUR llevamos más de 10 años surtiendo negocios de toda la península: desde fondas familiares hasta cadenas de restaurantes, hoteles y cocinas industriales. Aquí te decimos qué productos son los más pedidos y por qué.</p>

<h2>Lo que más piden los restaurantes</h2>

<h3>Recipientes y contenedores</h3>
<p>El almacenamiento es clave en cualquier cocina. Manejamos contenedores herméticos, cubetas con tapa, recipientes apilables y todo lo que necesitas para guardar ingredientes sin desperdiciar espacio ni comida. Todo en plástico de alta resistencia, apto para uso intensivo.</p>

<h3>Mesas y sillas</h3>
<p>Para el área de comensales, tenemos mesas y sillas resistentes, fáciles de limpiar y con presentación. Ya sea que montes un negocio nuevo o renueves el que tienes, podemos cotizarte por volumen con precios de mayoreo desde 6 piezas.</p>

<h3>Utensilios y artículos de cocina</h3>
<p>Desde tinas de lavado hasta coladores, escurridores, tablas y organizadores — tenemos todo lo que una cocina activa necesita tener a la mano. Piezas prácticas, a precios que no te quitan el sueño.</p>

<h3>Desechables para servicio</h3>
<p>Para negocios que manejan servicio para llevar: vasos, platos, cubiertos y empaques. Los pedidos por volumen tienen precio especial y te los podemos llevar directo o los recoges en cualquiera de nuestras sucursales.</p>

<h2>Precios de mayoreo desde 6 piezas</h2>
<p>No necesitas comprar un contenedor entero. En CRISTASUR el mayoreo aplica desde cantidades pequeñas, para que incluso los negocios chicos accedan a los mejores precios. Escríbenos por WhatsApp, dinos qué necesitas y te cotizamos sin rodeos.</p>

<p>Contamos con 3 sucursales en la Península — Mérida Matriz, Mérida Tanil y Bacalar — y hacemos envíos a toda la república.</p>
`.trim()
}

async function run() {
  // 1. Subir video a Vercel Blob
  if (!VIDEO_PATH) throw new Error('Proporciona la ruta al video: node scripts/add-blog.js "ruta/al/video.mp4"')
  if (!fs.existsSync(VIDEO_PATH)) throw new Error(`Video no encontrado: ${VIDEO_PATH}`)

  console.log('📤 Subiendo video a Vercel Blob...')
  const videoData = fs.readFileSync(VIDEO_PATH)
  const filename  = `blog/restaurantes-cristasur-${Date.now()}.mp4`

  const blobRes = await fetch(`https://blob.vercel-storage.com/${filename}`, {
    method: 'PUT',
    headers: {
      Authorization:   `Bearer ${BLOB_TOKEN}`,
      'content-type':  'video/mp4',
      'x-api-version': '7',
    },
    body: videoData,
  })
  if (!blobRes.ok) {
    const txt = await blobRes.text()
    throw new Error(`Blob error ${blobRes.status}: ${txt}`)
  }
  const { url: videoUrl } = await blobRes.json()
  console.log('✅ Video subido:', videoUrl)

  // 2. Conectar a MongoDB
  console.log('🔌 Conectando a MongoDB...')
  const mongoose = require('../node_modules/mongoose')
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado')

  // 3. Crear post
  const PostSchema = new mongoose.Schema({
    title: String, slug: String, excerpt: String,
    content: String, coverImage: String, author: String,
    tags: [String], published: Boolean, publishedAt: Date,
    seoTitle: String, seoDescription: String,
  }, { timestamps: true })
  const Post = mongoose.models.Post || mongoose.model('Post', PostSchema)

  const post = await Post.create({
    title:          'Cómo equipar tu restaurante sin gastar de más',
    slug:           'equipar-restaurante-merida-yucatan',
    excerpt:        'Lo que más piden los restaurantes, fondas y cocinas en Yucatán. Mesas, sillas, contenedores y más — con precios de mayoreo desde 6 piezas.',
    content:        buildContent(videoUrl),
    coverImage:     '',   // sin imagen de portada, el video es el hero
    author:         'CRISTASUR',
    tags:           ['restaurantes', 'mayoreo', 'cocina', 'mérida', 'yucatán'],
    published:      true,
    publishedAt:    new Date(),
    seoTitle:       'Cómo equipar tu restaurante en Mérida sin gastar de más | CRISTASUR',
    seoDescription: 'Mesas, sillas, recipientes y utensilios de cocina al mayoreo en Mérida, Yucatán. CRISTASUR lleva más de 10 años surtiendo restaurantes y negocios de la Península.',
  })

  console.log('\n🎉 ¡Post publicado!')
  console.log('   ID:  ', post._id.toString())
  console.log('   URL: ', 'https://cristasur.com/blog/equipar-restaurante-merida-yucatan')

  await mongoose.disconnect()
}

run().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
