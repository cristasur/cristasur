// ============================================================
// src/models/Review.js
// Reseñas de producto con moderación (status = pending | approved | rejected).
// Solo las aprobadas se muestran en el detalle.
// ============================================================
import mongoose from 'mongoose'

const ReviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 600 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    ip: { type: String, trim: true },
  },
  { timestamps: true }
)

ReviewSchema.index({ product: 1, status: 1, createdAt: -1 })

if (process.env.NODE_ENV !== 'production' && mongoose.models.Review) {
  delete mongoose.models.Review
}

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema)
