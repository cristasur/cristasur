// ============================================================
// Presence — registra sesiones activas para el contador "personas en línea".
// Cada cliente manda un heartbeat cada 30s. Si pasan más de 5min sin pingear,
// MongoDB borra automáticamente el documento gracias al TTL index.
// El admin ve cuántos documentos hay con lastSeen > now - 60s = en línea.
// ============================================================
import mongoose from 'mongoose'

const PresenceSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: null },
    name: { type: String, default: null },
    role: { type: String, default: null },
    path: { type: String, default: '/' },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    lastSeen: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
)

// TTL: borrar el documento 5 minutos después de la última actualización.
// Esto mantiene la colección chiquita y no necesita cron de limpieza.
PresenceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 })

export default mongoose.models.Presence || mongoose.model('Presence', PresenceSchema)
