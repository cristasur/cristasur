// ============================================================
// /sitemap.xml dinámico
// Incluye páginas estáticas + productos publicados + categorías + tags.
// Excluye productos en draft o con publishAt en el futuro.
// ============================================================
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'

export const revalidate = 3600 // cachear 1 h

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export default async function sitemap() {
  const base = siteUrl()
  const now = new Date()
  const staticRoutes = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/productos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/aviso-de-privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terminos`, lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ]

  try {
    await dbConnect()
    const [products, categories] = await Promise.all([
      Product.find({
        active: true,
        deleted: { $ne: true },
        $or: [{ publishAt: null }, { publishAt: { $lte: now } }],
      })
        .select('_id updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      Category.find({ active: true })
        .select('slug updatedAt')
        .lean(),
    ])

    const productRoutes = products.map((p) => ({
      url: `${base}/productos/${p._id}`,
      lastModified: p.updatedAt || now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
    const categoryRoutes = categories.map((c) => ({
      url: `${base}/categoria/${c.slug}`,
      lastModified: c.updatedAt || now,
      changeFrequency: 'daily',
      priority: 0.7,
    }))

    // Tags: extraemos los tags distintos de los productos publicados
    const distinctTags = await Product.distinct('tags', {
      active: true,
      deleted: { $ne: true },
    })
    const tagRoutes = (distinctTags || []).filter(Boolean).map((t) => ({
      url: `${base}/tag/${encodeURIComponent(t)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...tagRoutes]
  } catch (err) {
    console.error('sitemap error', err)
    return staticRoutes
  }
}
