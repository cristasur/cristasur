// ============================================================
// src/models/HomeSection.js
// Bloques de la portada, en el orden en que se ven. Se
// administran en /admin/portada: agregar, ordenar, prender/apagar
// y editar cada uno.
//
// Tipos (campo `type`):
//   carrusel     Carrusel horizontal de productos.
//                source: 'categoria' (usa `category`, sirve para
//                categoría o subcategoría), 'masVendidos',
//                'destacados' o 'nuevos'. `limit` = cuántos.
//   reels        "Contenido reciente": videos/fotos verticales de
//                redes. items[]: image (portada), href (link al
//                reel), videoUrl (mp4 opcional), title.
//   colecciones  Lista de colecciones a la izquierda y foto grande
//                a la derecha. items[]: title, text, image, href,
//                category (sus productos salen como miniaturas).
//   mosaico      1 cuadro grande + hasta 4 chicos. items[0] es el
//                grande (title, subtitle, text, image, href); el
//                resto son los chicos (title, image, href).
//   promos       Dos promociones lado a lado con sello de %
//                (items[0..1]: title, subtitle, image, href, badge
//                "15%", badgeLabel "Ahora") + banner de marca
//                opcional (items[2]: title, subtitle, image, href)
//                y texto a su lado (data.textoTitulo, data.texto,
//                data.boton, data.botonHref).
//   porque       ¿Por qué elegir CRISTASUR? title, subtitle,
//                image (foto del equipo), items[]: title + text
//                (cada razón).
//   resenas      Reseñas / experiencias. items[]: author, place,
//                text, stars (1-5). data.rating (ej. 4.8),
//                data.reviewsUrl (link a Google), data.writeUrl.
// ============================================================
import mongoose from 'mongoose'

const ItemSchema = new mongoose.Schema(
  {
    title:      { type: String, trim: true, default: '', maxlength: 140 },
    subtitle:   { type: String, trim: true, default: '', maxlength: 200 },
    text:       { type: String, trim: true, default: '', maxlength: 1200 },
    image:      { type: String, trim: true, default: '' },
    href:       { type: String, trim: true, default: '' },
    videoUrl:   { type: String, trim: true, default: '' },
    badge:      { type: String, trim: true, default: '', maxlength: 20 },  // "15%"
    badgeLabel: { type: String, trim: true, default: '', maxlength: 20 },  // "Ahora"
    category:   { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    author:     { type: String, trim: true, default: '', maxlength: 80 },
    place:      { type: String, trim: true, default: '', maxlength: 80 },
    stars:      { type: Number, min: 1, max: 5, default: 5 },
  },
  { _id: true }
)

const HomeSectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['carrusel', 'reels', 'colecciones', 'mosaico', 'promos', 'porque', 'resenas'],
    },
    title:    { type: String, trim: true, default: '', maxlength: 120 },
    subtitle: { type: String, trim: true, default: '', maxlength: 240 },
    image:    { type: String, trim: true, default: '' },
    href:     { type: String, trim: true, default: '' },   // "Ver todos"
    active:   { type: Boolean, default: true },
    order:    { type: Number, default: 0, index: true },

    // Solo carrusel
    source:   { type: String, enum: ['categoria', 'masVendidos', 'destacados', 'nuevos'], default: 'categoria' },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    limit:    { type: Number, min: 4, max: 24, default: 12 },

    items: { type: [ItemSchema], default: [] },
    data:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
)

export default mongoose.models.HomeSection || mongoose.model('HomeSection', HomeSectionSchema)
