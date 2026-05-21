// ============================================================
// src/models/Banner.js
// Slides del carrusel hero de la home.
// Administrable desde /admin/banners.
// ============================================================
import mongoose from 'mongoose'

const BannerSchema = new mongoose.Schema(
  {
    image:    { type: String, required: true, trim: true },   // URL Vercel Blob
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
