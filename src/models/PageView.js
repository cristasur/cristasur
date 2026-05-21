import mongoose from 'mongoose'

// Guarda visitas agrupadas por hora + URL + IP hash.
// Usamos upsert para incrementar el contador en lugar de insertar una fila por visita.
const PageViewSchema = new mongoose.Schema({
  // Identificador único: YYYY-MM-DD-HH + url + ipHash
  bucket:  { type: String, required: true, unique: true },
  date:    { type: String, required: true, index: true }, // 'YYYY-MM-DD'
  hour:    { type: Number, required: true },              // 0-23
  url:     { type: String, required: true },
  ipHash:  { type: String, required: true },
  count:   { type: Number, default: 1 },
}, { timestamps: false })

export default mongoose.models.PageView || mongoose.model('PageView', PageViewSchema)
