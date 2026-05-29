// ============================================================
// src/lib/models/Post.js
// Modelo Mongoose para artículos de blog
// ============================================================
import mongoose from 'mongoose'

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    excerpt: { type: String, trim: true, default: '' },
    content: { type: String, default: '' }, // HTML almacenado como string
    coverImage: { type: String, trim: true, default: '' },
    coverPosition: { type: String, trim: true, default: '50% 50%' }, // objectPosition CSS
    author: { type: String, trim: true, default: 'CRISTASUR' },
    tags: [{ type: String, trim: true }],
    published: { type: Boolean, default: false },
    publishedAt: { type: Date },
    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
    postType: { type: String, enum: ['article', 'video'], default: 'article' },
    featured: { type: Boolean, default: false },
    viewsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.Post || mongoose.model('Post', PostSchema)
