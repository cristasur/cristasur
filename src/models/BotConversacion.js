// ============================================================
// Conversaciones del bot de WhatsApp (una por número).
// Se guarda solo el texto (lo que dijo el cliente y lo que contestó
// el bot), las últimas ~30 vueltas, para que el bot tenga memoria.
// ============================================================
import mongoose from 'mongoose'

const MensajeSchema = new mongoose.Schema(
  {
    rol: { type: String, enum: ['cliente', 'bot', 'humano'], required: true },
    texto: { type: String, default: '' },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false }
)

const BotConversacionSchema = new mongoose.Schema(
  {
    telefono: { type: String, required: true, unique: true, index: true },
    nombre: { type: String, default: '' },
    mensajes: { type: [MensajeSchema], default: [] },
    // Ids de mensajes de WhatsApp ya atendidos (Meta reintenta avisos).
    atendidos: { type: [String], default: [] },
    // Pasado a una persona: el bot no contesta hasta esta fecha.
    humanoHasta: { type: Date, default: null },
    motivoHumano: { type: String, default: '' },
    // Límite diario de respuestas (control de gasto).
    hoy: { type: String, default: '' },
    respuestasHoy: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.BotConversacion || mongoose.model('BotConversacion', BotConversacionSchema)
