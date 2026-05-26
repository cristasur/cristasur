import mongoose from 'mongoose'

const BrandSchema = new mongoose.Schema(
  {
    name:   { type: String, required: true, trim: true },
    slug:   { type: String, required: true, trim: true, lowercase: true, unique: true },
    active: { type: Boolean, default: true },
    order:  { type: Number, default: 0 },
  },
  { timestamps: true }
)

BrandSchema.index({ slug: 1 })
BrandSchema.index({ active: 1, order: 1 })

export default mongoose.models.Brand || mongoose.model('Brand', BrandSchema)
