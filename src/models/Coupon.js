// ============================================================
// src/models/Coupon.js
// Cupones de descuento.
//   - type: 'percent' (0-100) | 'fixed' (monto MXN)
//   - scope: 'all' | categorías específicas | productos específicos
//   - usageLimit / usageCount: tope opcional de usos
//   - startsAt / endsAt: vigencia
// ============================================================
import mongoose from 'mongoose'

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      maxlength: 30,
      match: [/^[A-Z0-9_-]+$/, 'Solo letras, números, guion y guion bajo'],
    },
    description: { type: String, trim: true, maxlength: 200 },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minSubtotal: { type: Number, default: 0, min: 0 },
    // Alcance: si ambos arrays están vacíos, aplica a todo el catálogo
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    // Vigencia
    startsAt: { type: Date },
    endsAt: { type: Date },
    // Control de usos
    usageLimit: { type: Number, min: 0, default: 0 }, // 0 = ilimitado
    usageCount: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
)

CouponSchema.methods.isUsable = function (now = new Date()) {
  if (!this.active) return false
  if (this.startsAt && now < this.startsAt) return false
  if (this.endsAt && now > this.endsAt) return false
  if (this.usageLimit > 0 && this.usageCount >= this.usageLimit) return false
  return true
}

CouponSchema.methods.computeDiscount = function (subtotal) {
  if (subtotal < (this.minSubtotal || 0)) return 0
  if (this.type === 'percent') {
    return Math.round(subtotal * (Math.min(this.value, 100) / 100))
  }
  return Math.min(this.value, subtotal)
}

if (process.env.NODE_ENV !== 'production' && mongoose.models.Coupon) {
  delete mongoose.models.Coupon
}

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema)
