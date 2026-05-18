// ============================================================
// src/lib/mongodb.js
// Conexión singleton a MongoDB usando Mongoose.
// En desarrollo, Next.js recarga módulos con frecuencia, así que
// cacheamos la conexión en globalThis para no saturar la DB.
// ============================================================
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Falta la variable MONGODB_URI en .env.local. Revisa .env.example.'
  )
}

// Cache global para sobrevivir a los hot-reloads en dev
let cached = globalThis._mongooseCache
if (!cached) {
  cached = globalThis._mongooseCache = { conn: null, promise: null }
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Tiempos cortos para no dejar la página colgada si MongoDB
      // Atlas está caído o no hay red/DNS. Con 7s el usuario recibe
      // una respuesta rápida y puede reintentar.
      serverSelectionTimeoutMS: 7000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 7000,
    }
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => m)
      .catch((err) => {
        // Limpiamos el cache para que el siguiente intento reconecte
        cached.promise = null
        // Re-lanzamos con un mensaje más claro
        const friendly = buildFriendlyError(err)
        const e = new Error(friendly)
        e.original = err
        throw e
      })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }
  return cached.conn
}

function buildFriendlyError(err) {
  const msg = err?.message || String(err)
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(msg)) {
    return (
      'No se pudo resolver el host de MongoDB (problema de DNS o red). ' +
      'Verifica tu internet o cambia el DNS a 1.1.1.1 / 8.8.8.8. ' +
      'Detalle: ' +
      msg
    )
  }
  if (/ECONNREFUSED/i.test(msg)) {
    return (
      'MongoDB rechazó la conexión. Revisa que el cluster esté activo y ' +
      'que tu IP esté autorizada en Atlas. Detalle: ' +
      msg
    )
  }
  if (/bad auth|Authentication failed/i.test(msg)) {
    return (
      'Credenciales de MongoDB incorrectas. Revisa usuario y contraseña en ' +
      'MONGODB_URI. Detalle: ' +
      msg
    )
  }
  if (/ServerSelectionError/i.test(msg)) {
    return (
      'No se pudo seleccionar un servidor de MongoDB (timeout). ' +
      'Probablemente el cluster está pausado o hay un problema de red. Detalle: ' +
      msg
    )
  }
  return msg
}
