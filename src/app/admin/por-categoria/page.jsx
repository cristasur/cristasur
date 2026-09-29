// ============================================================
// /admin/por-categoria — Productos por categoría.
//
// A la izquierda el árbol de categorías (con subcategorías) y cuántos
// productos tiene cada una, más "Sin categoría". A la derecha los
// productos de la elegida: buscar, editar, y mover / agregar / quitar
// categoría a varios a la vez.
//
// URL: ?cat=<id> | ?cat=sin | (vacío = todos)   &q=  &p=
// ============================================================
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Product from '@/models/Product'
import Category from '@/models/Category'
import { esPrincipal, esHijaDe } from '@/lib/categoryParents'
import { soloStaff } from '@/lib/permisos'
import PorCategoriaClient from './PorCategoriaClient'

export const dynamic = 'force-dynamic'

const POR_PAGINA = 60
const BASE = { deleted: { $ne: true } }

export default async function PorCategoriaPage({ searchParams }) {
  searchParams = await searchParams
  const bloqueo = await soloStaff()
  if (bloqueo) return <div className="p-6 text-slate-500">No autorizado.</div>

  await dbConnect()
  const cat = String(searchParams?.cat || '')
  const q = String(searchParams?.q || '').trim().slice(0, 80)
  const pagina = Math.max(1, Number.parseInt(searchParams?.p, 10) || 1)

  const [cats, conteos, sinCategoria, total] = await Promise.all([
    Category.find({}).sort({ order: 1, name: 1 }).lean(),
    Product.aggregate([
      { $match: BASE },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', n: { $sum: 1 } } },
    ]),
    Product.countDocuments({ ...BASE, $or: [{ categories: { $size: 0 } }, { categories: { $exists: false } }] }),
    Product.countDocuments(BASE),
  ])
  const porCat = Object.fromEntries(conteos.map((c) => [String(c._id), c.n]))

  // Filtro de la lista
  const filtro = { ...BASE }
  if (cat === 'sin') filtro.$or = [{ categories: { $size: 0 } }, { categories: { $exists: false } }]
  else if (mongoose.Types.ObjectId.isValid(cat)) {
    // Una categoría principal incluye lo de sus subcategorías.
    const hijas = cats.filter((c) => esHijaDe(c, cat)).map((c) => c._id)
    filtro.categories = { $in: [new mongoose.Types.ObjectId(cat), ...hijas] }
  }
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const busca = [{ name: { $regex: safe, $options: 'i' } }, { sku: { $regex: safe, $options: 'i' } }]
    if (filtro.$or) { filtro.$and = [{ $or: filtro.$or }, { $or: busca }]; delete filtro.$or } else filtro.$or = busca
  }

  const [enLista, productos] = await Promise.all([
    Product.countDocuments(filtro),
    Product.find(filtro)
      .select('name sku image price stock status active categories line lineLabel')
      .sort({ name: 1 })
      .skip((pagina - 1) * POR_PAGINA)
      .limit(POR_PAGINA)
      .lean(),
  ])

  const arbol = cats
    .filter((c) => esPrincipal(c))
    .map((c) => ({
      _id: String(c._id), name: c.name, slug: c.slug, image: c.image || '', active: c.active !== false,
      n: porCat[String(c._id)] || 0,
      hijas: cats.filter((h) => esHijaDe(h, c._id)).map((h) => ({
        _id: String(h._id), name: h.name, slug: h.slug, active: h.active !== false, n: porCat[String(h._id)] || 0,
      })),
    }))

  return (
    <PorCategoriaClient
      key={`${cat}|${q}|${pagina}`}
      arbol={arbol}
      total={total}
      sinCategoria={sinCategoria}
      cat={cat}
      q={q}
      pagina={pagina}
      paginas={Math.max(1, Math.ceil(enLista / POR_PAGINA))}
      enLista={enLista}
      productos={JSON.parse(JSON.stringify(productos))}
    />
  )
}
