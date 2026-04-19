// ============================================================
// src/models/Product.js
// Modelo de Producto - relacionado con Category vía ObjectId.
// Incluye campo `featured` para destacar productos en la home
// y `stock` como base para escalar a e-commerce.
// ============================================================
import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
      minlength: [2, 'Nombre muy corto'],
      maxlength: [120, 'Nombre muy largo'],
      index: 'text',
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      minlength: [5, 'La descripción debe tener al menos 5 caracteres'],
      maxlength: [2000, 'Descripción demasiado larga'],
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    // Precio anterior, opcional, para mostrar descuentos
    comparePrice: {
      type: Number,
      min: 0,
      default: null,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'El producto debe tener al menos una categoría'],
      },
    ],
    // URL de la imagen principal. Puede ser /uploads/xxx.jpg o una URL externa.
    image: {
      type: String,
      default: '',
      trim: true,
    },
    // Galería opcional (para escalar)
    gallery: [
      {
        type: String,
        trim: true,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    // SKU opcional para control de inventario
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true,
    },
  },
  { timestamps: true }
)

// Índice de texto combinado para búsqueda (nombre + descripción)
ProductSchema.index({ name: 'text', description: 'text' })

// En desarrollo limpiamos el cache para que los cambios de schema
// se apliquen sin tener que reiniciar el servidor manualmente.
if (process.env.NODE_ENV !== 'production' && mongoose.models.Product) {
  delete mongoose.models.Product
}
export default mongoose.models.Product ||
  mongoose.model('P