// ============================================================
// src/models/User.js
// Usuarios del panel admin. Contraseñas con bcrypt.
// Por ahora solo rol `admin`, pero el esquema es extensible.
// ============================================================
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

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
    // Guardado como hash bcrypt, nunca en texto plano
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Administrador',
    },
    role: {
      type: String,
      enum: ['admin', 'editor'],
      default: 'admin',
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
)

// Método de instancia para comparar contraseñas de forma segura
UserSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

// Helper estático para crear usuarios hasheando la contraseña
UserSchema.statics.createWithPassword = async function ({ email, password, name, role = 'admin' }) {
  const passwordHash = await bcrypt.hash(password, 12)
  return this.create({ email, passwordHash, name, role })
}

if (process.env.NODE_ENV !== 'production' && mongoose.models.User) {
  delete mongoose.models.User
}
export default mongoose.models.User || mongoose.model('User', UserSchema)
