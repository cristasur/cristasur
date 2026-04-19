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
      // Tiempos razonables para que la app no se cuelgue si MongoDB no responde
      serverSelectionTimeoutMS: 10000,
    }
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m)
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }
  return cached.conn
}
