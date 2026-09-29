// Foto editable de una página informativa (ver lib/imagenesPaginasSlots.js).
import mongoose from 'mongoose'

const PageImageSchema = new mongoose.Schema(
  {
    slot: { type: String, required: true, unique: true, trim: true },
    url:  { type: String, trim: true, default: '' },
    pos:  { type: mongoose.Schema.Types.Mixed, default: null }, // {x, y, zoom}
  },
  { timestamps: true }
)

export default mongoose.models.PageImage || mongoose.model('PageImage', PageImageSchema)
