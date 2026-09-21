// ============================================================
// src/models/Category.js
// Modelo de Categoría - 100% administrable desde el panel
// Cada categoría tiene un slug único generado a partir del nombre
// que usamos en URLs como /categoria/juguetes
// ============================================================
import mongoose from 'mongoose'

// Helper para generar slugs URL-friendly (sin acentos ni espacios)
function toSlug(str = '') {
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')        // quitar acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')            // quitar símbolos
    .replace(/\s+/g, '-')                    // espacios -> guiones
    .replace(/-+/g, '-')                     // normalizar guiones
}

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre de la categoría es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [60, 'El nombre no puede superar 60 caracteres'],
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [300, 'La descripción no puede superar 300 caracteres'],
      default: '',
      trim: true,
    },
    // Texto SEO largo (200-2000 palabras). Aparece en /categoria/[slug] como
    // contenido indexable. Soporta saltos de línea simples (no markdown).
    seoText: {
      type: String,
      maxlength: 8000,
      default: '',
      trim: true,
    },
    seoTitle: {
      type: String,
      maxlength: 80,
      default: '',
      trim: true,
    },
    seoDescription: {
      type: String,
      maxlength: 200,
      default: '',
      trim: true,
    },
    // Icono opcional (emoji o letra) para mostrar cuando no hay imagen
    icon: {
      type: String,
      default: '',
      maxlength: 10,
    },
    // Imagen de portada de la categoría (URL externa o /uploads/...)
    image: {
      type: String,
      default: '',
      trim: true,
    },
    // Orden manual en la barra de navegación
    order: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Si está marcada, aparece en el mosaico destacado del hero (max 4)
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Color del bloque del banner en la landing de la categoría.
    // Clave de la paleta definida en src/lib/categoryColors.js.
    // Vacío = se usa el color por defecto.
    bannerColor: {
      type: String,
      default: '',
      maxlength: 20,
    },

    // ---- Jerarquía ----
    // null  = categoría principal (aparece en la barra de navegación)
    // ObjectId = subcategoría (aparece en el desplegable de su padre)
    //
    // Solo se admiten DOS niveles. Una subcategoría no puede tener hijas:
    // la API rechaza asignar como padre a una categoría que ya tiene padre.
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
)

// Genera el slug automáticamente antes de guardar
CategorySchema.pre('validate', function (next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = toSlug(this.name)
  }
  next()
})

// En producción reutilizamos el modelo ya registrado.
// En desarrollo, borramos el cache de Mongoose para que los cambios
// de schema (por ejemplo al añadir el campo `image`) se apliquen sin
// tener que reiniciar el servidor manualmente.
if (process.env.NODE_ENV !== 'production' && mongoose.models.Category) {
  delete mongoose.models.Category
}
export default mongoose.models.Category ||
  mongoose.model('Category', CategorySchema)
