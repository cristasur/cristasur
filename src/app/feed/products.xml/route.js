// ============================================================
// /feed/products.xml — Product feed compatible con Google Merchant
// Center y Meta Catalog. Genera XML RSS 2.0 con extensión Google.
//
// Cómo usar:
//   1. Google Merchant Center → Productos → Feed → "Recuperación
//      programada" → URL = https://cristasur.com/feed/products.xml.
//      Programá refresh diario.
//   2. Meta Business Suite → Comercio → Catálogo → "Añadir
//      productos" → "Cargar desde URL" → pega la misma URL.
//      Meta también acepta este XML (estándar RSS).
//   3. Una vez aprobado el catálogo en Meta, conectar Instagram
//      Shopping (Configuración → Compras → Catálogo). Eso habilita
//      los anuncios con imagen + tag al producto.
//
// Filtra: sólo productos publicados, activos, no borrados, no draft,
// con imagen y precio > 0 (los requisitos mínimos de Google/Meta).
// ============================================================
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://cristasur.com').replace(/\/$/, '')
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function absUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return siteUrl() + (path.startsWith('/') ? path : `/${path}`)
}

export async function GET() {
  try {
    await dbConnect()
    const now = new Date()
    // Filtro estricto: sólo publicados, con imagen y precio.
    const products = await Product.find({
      active: true,
      deleted: { $ne: true },
      image: { $ne: '' },
      price: { $gt: 0 },
      $and: [
        { $or: [{ status: { $exists: false } }, { status: 'published' }] },
        { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
      ],
    })
      .populate('categories', 'name')
      .populate('brand', 'name')
      .select('name description price wholesalePrice comparePrice image gallery sku categories brand stock variants updatedAt')
      .limit(20000)
      .lean()

    const base = siteUrl()
    const items = products
      .map((p) => {
        const id = String(p._id)
        const title = escapeXml((p.name || '').slice(0, 150))
        const desc = escapeXml((p.description || p.name || '').slice(0, 5000))
        const link = `${base}/productos/${id}`
        const img = absUrl(p.image)
        const gallery = (Array.isArray(p.gallery) ? p.gallery : [])
          .slice(0, 10)
          .map((g) => `<g:additional_image_link>${escapeXml(absUrl(g))}</g:additional_image_link>`)
          .join('')
        const price = `${Number(p.price).toFixed(2)} MXN`
        // Si tiene precio comparativo o mayoreo, se reporta como sale_price.
        const sale =
          p.wholesalePrice && Number(p.wholesalePrice) > 0 && Number(p.wholesalePrice) < Number(p.price)
            ? `<g:sale_price>${Number(p.wholesalePrice).toFixed(2)} MXN</g:sale_price>`
            : p.comparePrice && Number(p.comparePrice) > Number(p.price)
              ? `` // comparePrice es para tachar el "antes", se invierte: dejamos price como sale
              : ''
        const availability = (p.stock ?? 1) > 0 ? 'in stock' : 'out of stock'
        const sku = escapeXml(p.sku || id)
        const brand = escapeXml(p.brand?.name || 'CRISTASUR')
        const category = escapeXml(p.categories?.[0]?.name || 'General')

        return `<item>
  <g:id>${escapeXml(id)}</g:id>
  <g:title>${title}</g:title>
  <g:description>${desc}</g:description>
  <g:link>${escapeXml(link)}</g:link>
  <g:image_link>${escapeXml(img)}</g:image_link>
  ${gallery}
  <g:availability>${availability}</g:availability>
  <g:price>${price}</g:price>
  ${sale}
  <g:condition>new</g:condition>
  <g:brand>${brand}</g:brand>
  <g:mpn>${sku}</g:mpn>
  <g:identifier_exists>${p.sku ? 'yes' : 'no'}</g:identifier_exists>
  <g:product_type>${category}</g:product_type>
  <g:google_product_category>Home &amp; Garden</g:google_product_category>
  <g:shipping>
    <g:country>MX</g:country>
    <g:service>Standard</g:service>
    <g:price>0.00 MXN</g:price>
  </g:shipping>
</item>`
      })
      .join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>CRISTASUR — Catálogo</title>
  <link>${base}</link>
  <description>Plásticos y artículos para hogar y negocio. Mérida y Bacalar.</description>
${items}
</channel>
</rss>`

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('feed/products.xml error', err)
    return new Response('<?xml version="1.0"?><error/>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    })
  }
}
