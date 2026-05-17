// ============================================================
// src/models/Order.js
// Pedidos. Se crean en estado 'intent' cuando el cliente da clic
// en "Pedir por WhatsApp" (registramos qué quería pedir aunque
// no completó). El admin luego puede confirmar/cancelar/etc.
// Sirve para:
//   - No perder pedidos en el chat de WhatsApp.
//   - Calcular co-occurrence ("también compraron").
//   - Métricas reales de conversión (intent → confirmed).
// ============================================================
import mongoose from 'mongoose'

const OrderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, trim: true, required: true },
    sku: { type: String, trim: true, default: '' },
    image: { type: String, trim: true, default: '' },
    variantLabel: { type: String, trim: true, default: '' },
    variantValue: { type: String, trim: true, default: '' },
    qty: { type: Number, min: 1, required: true },
    unitPrice: { type: Number, min: 0, required: true },
    wholesaleApplied: { type: Boolean, default: false },
  },
  { _id: false }
)

const OrderSchema = new mongoose.Schema(
  {
    items: { type: [OrderItemSchema], default: [] },
    subtotal: { type: Number, min: 0, required: true },
    discount: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, required: true },
    couponCode: { type: String, trim: true, uppercase: true, default: '' },
    customerName: { type: String, trim: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    customerEmail: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },

    // Estado del pedido. 'intent' significa que el cliente dio clic en
    // WhatsApp; no garantiza que escribió. El admin lo mueve manualmente.
    status: {
      type: String,
      enum: ['intent', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'intent',
      index: true,
    },
    source: { type: String, enum: ['whatsapp', 'manual', 'web'], default: 'whatsapp' },
    cookieToken: { type: String, default: '' }, // para poder enlazar el "tu última compra"
    ipHash: { type: String, default: '' },      // hash truncado, no IP cruda

    confirmedAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

OrderSchema.index({ status: 1, createdAt: -1 })
OrderSchema.index({ createdAt: -1 })

if (process.env.NODE_ENV !== 'production' && mongoose.models.Order) {
  delete mongoose.models.Order
}
export default mongoose.models.Order || mongoose.model('Order', OrderSchema)
