// ============================================================
// Home - Hero + Categorías + bloques administrables de portada
//
// Después de "Comprar por categoría" se pintan los bloques de
// HomeSection (se administran en /admin/portada) en su orden.
// Si todavía no hay ningún bloque activo, se muestran Destacados
// y Nuevos para que la portada nunca quede vacía.
// ============================================================
import Link from 'next/link'
import dbConnect from '@/lib/mongodb'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Banner from '@/models/Banner'
import HomeSection from '@/models/HomeSection'
import { parseInstagram, fechaInstagram, datosInstagram } from '@/lib/instagram'
import Hero from '@/components/Hero'
import Icon from '@/components/Icon'
import RepeatOrder from '@/components/RepeatOrder'
import CategoryGrid from '@/components/CategoryGrid'
import HomeSections from '@/components/home/HomeSections'
import ProductCarousel from '@/components/home/ProductCarousel'

// El home es dinámico: cuando un admin cambia "destacado" o publica algo,
// el siguiente visitante debe verlo ya. Si se necesita aliviar carga, cambiar
// a `export const revalidate = 10` (10 segundos) — pero confirma probarlo
// primero porque los cambios desde admin no se reflejan hasta el TTL.
export const dynamic = 'force-dynamic'

const serialize = (x) => JSON.parse(JSON.stringify(x))

// Filtro común para producto visible al público:
// - activo, no eliminado, status != draft, publicado (publishAt vencido).
function buildPublicMatch() {
  const now = new Date()
  return {
    active: true,
    deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  }
}

// Consulta de productos para tarjetas (con categorías y marca pobladas).
function productQuery(filter, sort, limit) {
  return Product.find(filter)
    .populate('categories', 'name slug')
    .populate('brand', 'name slug')
    .sort(sort)
    .limit(limit)
    .lean()
}

// "Ver todos" por defecto cuando el admin no puso link en el carrusel.
function defaultCarouselHref(section) {
  if (section.source === 'categoria' && section.category?.slug) return `/categoria/${section.category.slug}`
  if (section.source === 'destacados') return '/productos?featured=1'
  if (section.source === 'masVendidos') return '/productos?sort=popular'
  return '/productos'
}

// Carga los productos de cada carrusel y las miniaturas de cada colección.
async function loadSectionsData(sections, publicMatch) {
  // 1) Categorías que necesitamos (carruseles por categoría + colecciones).
  const catIds = new Set()
  for (const s of sections) {
    if (s.type === 'carrusel' && s.source === 'categoria' && s.category?._id) catIds.add(String(s.category._id))
    if (s.type === 'colecciones') {
      for (const it of s.items || []) if (it.category?._id) catIds.add(String(it.category._id))
    }
  }

  // 2) Subcategorías de todas ellas en una sola consulta: un carrusel de
  //    "Desechables" también debe mostrar lo de sus subcategorías.
  const childrenOf = new Map()
  if (catIds.size) {
    const children = await Category.find({ parent: { $in: [...catIds] } }).select('_id parent').lean()
    for (const c of children) {
      const key = String(c.parent)
      if (!childrenOf.has(key)) childrenOf.set(key, [])
      childrenOf.get(key).push(c._id)
    }
  }
  const withChildren = (id) => [id, ...(childrenOf.get(String(id)) || [])]

  // 3) Todas las consultas de productos en paralelo.
  const tasks = sections.map((s) => {
    if (s.type === 'carrusel') {
      const limit = Math.min(Math.max(Number(s.limit) || 12, 4), 24)
      switch (s.source) {
        case 'masVendidos':
          return productQuery(publicMatch, { salesCount: -1, featured: -1, createdAt: -1 }, limit)
        case 'destacados':
          return productQuery({ ...publicMatch, featured: true }, { sortOrder: 1, createdAt: -1 }, limit)
        case 'nuevos':
          return productQuery(publicMatch, { createdAt: -1 }, limit)
        case 'categoria':
        default:
          if (!s.category?._id) return Promise.resolve([])
          return productQuery(
            { ...publicMatch, categories: { $in: withChildren(s.category._id) } },
            { sortOrder: 1, featured: -1, createdAt: -1 },
            limit
          )
      }
    }
    if (s.type === 'colecciones') {
      // Solo la foto: miniaturas de hasta 4 productos por colección.
      return Promise.all(
        (s.items || []).map((it) =>
          it.category?._id
            ? Product.find({ ...publicMatch, categories: { $in: withChildren(it.category._id) }, image: { $nin: ['', null] } })
                .select('_id name image')
                .sort({ featured: -1, salesCount: -1, createdAt: -1 })
                .limit(4)
                .lean()
            : Promise.resolve([])
        )
      )
    }
    if (s.type === 'reels') {
      // Portada y texto de cada reel de Instagram (caché 6 h).
      return Promise.all(
        (s.items || []).map((it) => {
          const ig = parseInstagram(it.href)
          return ig ? datosInstagram(ig.code, ig.kind) : Promise.resolve({})
        })
      )
    }
    return Promise.resolve(null)
  })
  const results = await Promise.all(tasks)

  return sections.map((s, i) => {
    if (s.type === 'carrusel') {
      return { ...s, href: s.href || defaultCarouselHref(s), products: results[i] || [] }
    }
    if (s.type === 'colecciones') {
      const thumbs = results[i] || []
      return {
        ...s,
        items: (s.items || []).map((it, j) => ({
          ...it,
          href: it.href || (it.category?.slug ? `/categoria/${it.category.slug}` : ''),
          products: thumbs[j] || [],
        })),
      }
    }
    if (s.type === 'reels') {
      const datos = results[i] || []
      return {
        ...s,
        items: (s.items || []).map((it, j) => {
          const ig = parseInstagram(it.href)
          const d = datos[j] || {}
          return {
            ...it,
            // Lo capturado a mano manda; si no, lo de Instagram.
            image: it.image || d.cover || '',
            text: it.text || d.caption || '',
            igCode: ig?.code || '',
            igKind: ig?.kind || '',
            href: ig?.url || it.href || '',
            date: ig ? fechaInstagram(ig.code) : null,
          }
        }),
      }
    }
    return s
  })
}

async function loadHome() {
  await dbConnect()
  const publicMatch = buildPublicMatch()

  const [categories, banners, rawSections] = await Promise.all([
    Category.find({ active: true }).sort({ order: 1, name: 1 }).lean(),
    Banner.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean(),
    HomeSection.find({ active: true })
      .sort({ order: 1, createdAt: 1 })
      .populate('category', 'name slug')
      .populate('items.category', 'name slug')
      .lean(),
  ])

  let sections = []
  let featured = []
  let newest = []
  if (rawSections.length) {
    sections = await loadSectionsData(rawSections, publicMatch)
  } else {
    // Respaldo: sin bloques configurados, se ven Destacados y Nuevos.
    ;[featured, newest] = await Promise.all([
      productQuery({ ...publicMatch, featured: true }, { sortOrder: 1, createdAt: -1 }, 12),
      productQuery(publicMatch, { createdAt: -1 }, 12),
    ])
  }

  return {
    categories: serialize(categories),
    banners:    serialize(banners),
    sections:   serialize(sections),
    featured:   serialize(featured),
    newest:     serialize(newest),
  }
}

export default async function HomePage() {
  const { categories, banners, sections, featured, newest } = await loadHome()

  return (
    <div>
      {/* Carrusel de banners. Todo se administra en /admin/banners. */}
      <Hero banners={banners} />

      {/* Banner: repetir último pedido (solo si el cliente tiene historial local) */}
      <div className="pt-6">
        <RepeatOrder />
      </div>

      {/* Categorías */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Comprar por categoría</h2>
          </div>
          <Link href="/productos" className="text-sm font-bold text-slate-900 hover:text-brand-700 inline-flex items-center gap-1.5 shrink-0">
            Ver todos
            <Icon name="arrow" className="w-4 h-4" />
          </Link>
        </div>
        {/* Solo categorías principales. Al hacer clic lleva a la categoría;
            las subcategorías se ven al entrar o desde la barra de navegación. */}
        <CategoryGrid categories={categories.filter((c) => !c.parent)} />
      </section>

      {sections.length > 0 ? (
        // Bloques administrables (/admin/portada)
        <HomeSections sections={sections} />
      ) : (
        <>
          {/* Respaldo: Destacados */}
          {featured.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-accent-600 font-bold">Lo que más se vende</div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Productos destacados</h2>
                </div>
                <Link href="/productos?featured=1" className="text-sm font-bold text-slate-900 hover:text-brand-700 inline-flex items-center gap-1 shrink-0">
                  Ver todos
                  <Icon name="chevron" className="w-4 h-4" />
                </Link>
              </div>
              <ProductCarousel products={featured} label="Productos destacados" />
            </section>
          )}

          {/* Respaldo: Nuevos */}
          {newest.length > 0 && (
            <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs uppercase tracking-widest text-brand-600 font-bold">Recién llegados</div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">Nuevos productos</h2>
                </div>
                <Link href="/productos" className="text-sm font-bold text-slate-900 hover:text-brand-700 inline-flex items-center gap-1 shrink-0">
                  Ver todos
                  <Icon name="chevron" className="w-4 h-4" />
                </Link>
              </div>
              <ProductCarousel products={newest} label="Nuevos productos" />
            </section>
          )}
        </>
      )}
    </div>
  )
}
