// ============================================================
// src/models/User.js
// Modelo unificado para administradores y clientes:
//   - role: 'admin' | 'editor' | 'customer'
//   - admin/editor → acceden a /admin
//   - customer → cuentas de clientes (registro público), carrito
//     persistente en BD y acceso opcional a precios mayoreo VIP.
// Contraseñas con bcrypt.
// ============================================================
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const CartLineSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    variantLabel: { type: String, default: '' },
    variantValue: { type: String, default: '' },
    qty: { type: Number, min: 1, default: 1 },
    price: { type: Number, min: 0, default: 0 },
    wholesalePrice: { type: Number, default: null },
    wholesaleMinQty: { type: Number, default: null },
    categoryIds: { type: [String], default: [] },
  },
  { _id: false }
)

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    role: {
      type: String,
      enum: ['admin', 'editor', 'customer'],
      default: 'customer',
      index: true,
    },

    // Acceso VIP a precios mayoreo: cuando es true, el cliente ve la
    // vista /mayoreo donde TODOS los productos con wholesalePrice se
    // muestran a ese precio (sin importar la cantidad mínima).
    // Lo otorga/revoca el admin desde /admin/usuarios.
    wholesaleAccess: { type: Boolean, default: false, index: true },

    // Dirección de envío principal (opcional)
    address: {
      street: { type: String, default: '' },
      neighborhood: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zip: { type: String, default: '' },
      notes: { type: String, default: '' },
    },

    // Carrito persistente: cuando el cliente está logueado, sincronizamos
    // su carrito a este array para que sobreviva cierres de sesión y
    // dispositivos. El cliente anónimo sigue usando localStorage.
    cart: { type: [CartLineSchema], default: [] },
    cartUpdatedAt: { type: Date, default: null },

    lastLoginAt: Date,

    // Recuperación de contraseña
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    // Verificación de email
    emailVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null },
    // Para recordatorio de carrito abandonado
    cartReminderSentAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Método de instancia para comparar contraseñas de forma segura
UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

// Helper estático para crear usuarios hasheando la contraseña
UserSchema.statics.createWithPassword = async function ({
  email,
  password,
  name,
  role = 'customer',
  phone = '',
}) {
  const passwordHash = await bcrypt.hash(password, 12)
  return this.create({ email, passwordHash, name, role, phone })
}

if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  delete mongoose.models.User
}
export default mongoose.models.User || mongoose.model('User', UserSchema)
