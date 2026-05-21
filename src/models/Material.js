import mongoose from 'mongoose'

const MaterialSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    slug:   { type: String, required: true, trim: true, lowercase: true, unique: true },
    active: { type: Boolean, default: true },
    order:  { type: Number, default: 0 },
  },
  { timestamps: true }
)

MaterialSchema.index({ slug: 1 })
MaterialSchema.index({ active: 1, order: 1 })

export default mongoose.models.Material || mongoose.model('Material', MaterialSchema)
