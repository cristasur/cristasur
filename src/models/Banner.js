// ============================================================
// src/models/Banner.js
// Slides del carrusel hero de la home.
// Administrable desde /admin/banners.
// ============================================================
import mongoose from 'mongoose'

const BannerSchema = new mongoose.Schema(
  {
    image:    { type: String, required: true, trim: true },   // URL Vercel Blob
    // Versión para celular (cuadrada, 1080×1080). Opcional: si falta,
    // en celular se usa la de compu. Ver Hero.jsx para la regla.
    imageMobile: { type: String, trim: true, default: '' },
    // Qué parte de la imagen se ve en el recuadro (ver lib/encuadre.js).
    // Se ajusta desde el panel: arrastrar, zoom y centrar.
    pos: {
      x:    { type: Number, min: 0, max: 100, default: 50 },
      y:    { type: Number, min: 0, max: 100, default: 50 },
      zoom: { type: Number, min: 1, max: 2.5, default: 1 },
    },
    posMobile: {
      x:    { type: Number, min: 0, max: 100, default: 50 },
      y:    { type: Number, min: 0, max: 100, default: 50 },
      zoom: { type: Number, min: 1, max: 2.5, default: 1 },
    },
    title:    { type: String, trim: true, default: '' },      // texto opcional encima
    subtitle: { type: String, trim: true, default: '' },
    href:     { type: String, trim: true, default: '' },      // link al hacer click
    cta:      { type: String, trim: true, default: '' },      // texto del botón
    active:   { type: Boolean, default: true },
    order:    { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema)
