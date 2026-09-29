// ============================================================
// Mensajes del formulario de /contacto.
// ============================================================
import mongoose from 'mongoose'

const ContactMessageSchema = new mongoose.Schema(
  {
    nombre:   { type: String, trim: true, required: true, maxlength: 120 },
    correo:   { type: String, trim: true, lowercase: true, required: true, maxlength: 160 },
    telefono: { type: String, trim: true, default: '', maxlength: 40 },
    motivo:   { type: String, trim: true, default: '', maxlength: 60 },
    mensaje:  { type: String, trim: true, required: true, maxlength: 3000 },
    ip:       { type: String, default: '' },
    atendido: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

export default mongoose.models.ContactMessage || mongoose.model('ContactMessage', ContactMessageSchema)
