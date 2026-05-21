// ============================================================
// src/models/Product.js
// Modelo de Producto con soporte para:
//   - Variantes (ej. tamaño / color) con stock, precio e imagen propios
//   - Soft delete (papelera): deleted + deletedAt
//   - Historial de cambios embebido (editHistory)
//   - Contadores (views, whatsappClicks, salesCount) para métricas
//   - Galería + imagen principal
// ============================================================
import mongoose from 'mongoose'

// Variantes embebidas: cada una puede tener su propio precio, stock e imagen.
// Si el producto tiene variantes, el precio/stock del producto padre sirven
// como valores "por defecto" cuando el usuario aún no elige.
const VariantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 }, // "Tamaño", "Color"
    value: { type: String, required: true, trim: true, maxlength: 60 }, // "10L", "Rojo"
    sku: { type: String, trim: true, uppercase: true, maxlength: 40 },
    price: { type: Number, min: 0 },       // null → hereda del producto padre
    comparePrice: { type: Number, min: 0 }, // null → hereda
    stock: { type: Number, min: 0, default: 0 },
    image: { type: String, trim: true, default: '' },
  },
  { _id: true }
)

const EditLogSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userEmail: { type: String, trim: true },
    action: { type: String, enum: ['create', 'update', 'delete', 'restore', 'duplicate', 'import', 'import-update', 'bulk-update', 'publish', 'unpublish'], required: true },
    changes: { type: String }, // resumen humano legible (ej. "price: 150 → 180, stock: 5 → 10")
  },
  { _id: false }
)

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120, index: 'text' },
    description: { type: String, required: true, trim: true, minlength: 5, maxlength: 800 },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0, default: null },
    // Precio mayoreo (opcional). Si se define, requiere wholesaleMinQty.
    // Cuando un cliente añade qty >= wholesaleMinQty al carrito, se aplica
    // automáticamente el wholesalePrice por unidad.
    wholesalePrice: { type: Number, min: 0, default: null },
    wholesaleMinQty: { type: Number, min: 1, default: null },
    categories: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    ],
    image: { type: String, default: '', trim: true },
    gallery: { type: [String], default: [] },
    // URL de video (YouTube, TikTok o enlace directo .mp4). Se muestra como
    // primer elemento de la galería si está definido.
    videoUrl: { type: String, default: '', trim: true },
    // Variantes opcionales. Si el array está vacío, el producto no tiene variantes.
    variants: { type: [VariantSchema], default: [] },

    featured: { type: Boolean, default: false, index: true },
    stock: { type: Number, default: null, min: 0 }, // null = sin límite / no se sabe
    active: { type: Boolean, default: true, index: true },
    sku: { type: String, trim: true, uppercase: true, sparse: true, unique: true },

    // Estado del producto:
    //   draft     → sólo visible en admin
    //   published → visible públicamente (si active = true)
    // Si publishAt está en el futuro, se considera draft hasta esa fecha.
    status: { type: String, enum: ['draft', 'published'], default: 'published', index: true },
    publishAt: { type: Date, default: null },

    // Cantidad mínima de compra y múltiplo de venta.
    // Ej: qtyStep=3 → el cliente solo puede pedir 3, 6, 9, 12...
    // Ej: qtyStep=6 → el cliente solo puede pedir 6, 12, 18...
    // null o 1 = de uno en uno (comportamiento normal).
    qtyStep: { type: Number, min: 1, default: null },

    // ---- Dimensiones y logística (para envia.com y carriers) ----
    // Todas las medidas son del paquete listo para enviar (producto + embalaje).
    // Unidades fijas: peso en kg, dimensiones en cm.
    // Si algún campo queda null, el carrier usará valores por defecto al cotizar.
    weight: { type: Number, min: 0, default: null },   // kg  — peso bruto con embalaje
    length: { type: Number, min: 0, default: null },   // cm  — largo (dimensión mayor)
    width:  { type: Number, min: 0, default: null },   // cm  — ancho
    height: { type: Number, min: 0, default: null },   // cm  — alto

    // Marca opcional (ref a la colección Brand)
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },

    // Materiales (puede tener varios: plástico, vidrio, acero…)
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Material' }],

    // Color principal del producto (texto libre, ej: "Rojo", "Azul marino")
    color: { type: String, trim: true, default: '' },

    // Etiquetas libres (eco, navidad, restaurante, etc.). Independientes de
    // las categorías. Usadas para filtros cruzados y landings estacionales.
    tags: { type: [String], default: [], index: true },

    // "También compraron": contador por producto co-pedido en el mismo carrito.
    // Se incrementa al registrar la intención de pedido (Order pending).
    coOrders: { type: Map, of: Number, default: {} },

    // ---- Soft delete (papelera) ----
    deleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    // ---- Métricas ----
    viewsCount: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
    salesCount: { type: Number, default: 0 }, // se incrementa manualmente al marcar pedido completado

    // ---- Reseñas (caché desnormalizado para no agregar en cada request) ----
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },

    // ---- Auditoría ----
    editHistory: { type: [EditLogSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
)

ProductSchema.index({ name: 'text', description: 'text', color: 'text' })
ProductSchema.index({ deleted: 1, active: 1, featured: 1 })

if (process.env.NODE_ENV !== 'production' && mongoose.models.Product) {
  delete mongoose.models.Product
}

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
