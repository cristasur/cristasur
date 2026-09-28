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
// Productos con variantes: un <item> por variante con g:item_group_id.
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
    // La imagen puede vivir en el padre o en alguna variante (modelo simétrico).
    const products = await Product.find({
      active: true,
      deleted: { $ne: true },
      price: { $gt: 0 },
      $and: [
        { $or: [{ status: { $exists: false } }, { status: 'published' }] },
        { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
        { $or: [{ image: { $nin: ['', null] } }, { 'variants.image': { $nin: ['', null] } }] },
      ],
    })
      .populate('categories', 'name')
      .populate('brand', 'name')
      .select('name description price image gallery sku categories brand stock variants updatedAt')
      .limit(20000)
      .lean()

    const base = siteUrl()

    // Disponibilidad: stock null = sin control de inventario = hay.
    const hayStock = (stock) => stock === null || stock === undefined || Number(stock) > 0

    // Id estable por variante: "<id>-<valor-en-slug>"; si el valor no da un
    // slug usable o se repite, se usa el índice.
    const slugify = (s) =>
      String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // Arma un <item>. `extra` trae lo que cambia entre padre y variante.
    function itemXml(p, extra) {
      const brand = escapeXml(p.brand?.name || 'CRISTASUR')
      const category = escapeXml(p.categories?.[0]?.name || 'General')
      const desc = escapeXml((p.description || p.name || '').slice(0, 5000))
      const gallery = (extra.gallery || [])
        .filter(Boolean)
        .slice(0, 10)
        .map((g) => `<g:additional_image_link>${escapeXml(absUrl(g))}</g:additional_image_link>`)
        .join('')
      // Sólo se publica el precio normal. El mayoreo NO va como sale_price:
      // exige una cantidad mínima y Google lo tomaría como precio por pieza.
      const price = `${Number(p.price).toFixed(2)} MXN`

      return `<item>
  <g:id>${escapeXml(extra.id)}</g:id>
  ${extra.groupId ? `<g:item_group_id>${escapeXml(extra.groupId)}</g:item_group_id>` : ''}
  <g:title>${escapeXml(String(extra.title || '').slice(0, 150))}</g:title>
  <g:description>${desc}</g:description>
  <g:link>${escapeXml(extra.link)}</g:link>
  <g:image_link>${escapeXml(absUrl(extra.image))}</g:image_link>
  ${gallery}
  <g:availability>${extra.inStock ? 'in stock' : 'out of stock'}</g:availability>
  <g:price>${price}</g:price>
  ${extra.color ? `<g:color>${escapeXml(extra.color)}</g:color>` : ''}
  <g:condition>new</g:condition>
  <g:brand>${brand}</g:brand>
  <g:mpn>${escapeXml(extra.sku || extra.id)}</g:mpn>
  <g:identifier_exists>${extra.sku ? 'yes' : 'no'}</g:identifier_exists>
  <g:product_type>${category}</g:product_type>
  <g:google_product_category>Home &amp; Garden</g:google_product_category>
  <g:shipping>
    <g:country>MX</g:country>
    <g:service>Standard</g:service>
    <g:price>0.00 MXN</g:price>
  </g:shipping>
</item>`
    }

    const items = products
      .flatMap((p) => {
        const id = String(p._id)
        const link = `${base}/productos/${id}`
        const variants = Array.isArray(p.variants) ? p.variants : []

        // Sin variantes: un solo item, como siempre.
        if (!variants.length) {
          if (!p.image) return []
          return [itemXml(p, {
            id,
            title: p.name || '',
            link,
            image: p.image,
            gallery: Array.isArray(p.gallery) ? p.gallery : [],
            inStock: hayStock(p.stock),
            sku: p.sku || '',
            color: p.color || '',
          })]
        }

        // Con variantes: un item por variante, agrupados por item_group_id.
        const usados = new Set()
        return variants
          .map((v, idx) => {
            const image = v.image || v.images?.[0] || p.image
            if (!image) return null // Google exige imagen
            let vid = slugify(v.value)
            vid = vid && !usados.has(vid) ? `${id}-${vid}` : `${id}-${idx}`
            usados.add(vid.slice(id.length + 1))
            const otras = (Array.isArray(v.images) ? v.images : []).filter((x) => x && x !== image)
            return itemXml(p, {
              id: vid,
              groupId: id,
              title: v.value ? `${p.name || ''} - ${v.value}` : (p.name || ''),
              link: `${link}?color=${encodeURIComponent(v.value || '')}`,
              image,
              gallery: otras.length ? otras : (Array.isArray(p.gallery) ? p.gallery : []),
              inStock: v.available !== false && hayStock(v.stock),
              sku: v.sku || p.sku || '',
              color: v.value || '',
            })
          })
          .filter(Boolean)
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
