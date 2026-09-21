'use client'
// ============================================================
// CategoryGrid — cuadrícula de categorías con líneas divisorias.
//
// Un solo contenedor con borde, partido en celdas iguales. Cada
// celda lleva la imagen en círculo y el nombre debajo.
//
// Al pasar el mouse sobre una categoría con subcategorías se abre
// un panel debajo de la cuadrícula: subcategorías a la izquierda
// y productos de esa categoría a la derecha.
//
// Las celdas sobrantes de la última fila se rellenan vacías para
// que las líneas no queden cortadas a la mitad.
// ============================================================
import { useRef, useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { buildCategoryTree } from '@/lib/categoryTree'

const PREVIEW_LIMIT = 4
const CLOSE_DELAY_MS = 160
const COLS_LG = 4 // columnas en escritorio; cambia también la clase de abajo

function money(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(n) || 0)
}

export default function CategoryGrid({ categories = [], allCategories = [] }) {
  const [openId, setOpenId] = useState(null)
  const [preview, setPreview] = useState({})
  const closeTimer = useRef(null)
  const fetched = useRef(new Set())

  // Árbol armado con la lista completa (incluye subcategorías), pero solo
  // mostramos como celdas las principales que nos pasaron en `categories`.
  const tree = useMemo(() => {
    const source = allCategories.length ? allCategories : categories
    const byId = new Map(buildCategoryTree(source).map((c) => [String(c._id), c]))
    return categories.map((c) => byId.get(String(c._id)) || { ...c, children: [] })
  }, [categories, allCategories])

  // Celdas vacías para completar la última fila.
  const fillers = useMemo(() => {
    const rest = tree.length % COLS_LG
    return rest === 0 ? 0 : COLS_LG - rest
  }, [tree.length])

  async function loadPreview(slug) {
    if (fetched.current.has(slug)) return
    fetched.current.add(slug)
    try {
      const res = await fetch(`/api/products?category=${encodeURIComponent(slug)}&limit=${PREVIEW_LIMIT}&fields=mini`)
      if (!res.ok) return
      const data = await res.json()
      setPreview((p) => ({ ...p, [slug]: data.products || [] }))
    } catch {
      // Sin vista previa el panel sigue sirviendo para las subcategorías.
    }
  }

  function openNow(cat) {
    clearTimeout(closeTimer.current)
    setOpenId(cat._id)
    loadPreview(cat.slug)
  }
  function closeSoon() {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  if (!tree.length) return null

  const openCat = tree.find((c) => c._id === openId)

  return (
    <div className="relative" onMouseLeave={closeSoon}>
      {/* Cuadrícula. El borde superior e izquierdo va en el contenedor y
          cada celda aporta el derecho e inferior: así las líneas quedan
          de un solo pixel y sin dobles. */}
      <div className="rounded-2xl overflow-hidden border-t border-l border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {tree.map((c) => {
          const isOpen = openId === c._id
          return (
            <Link
              key={c._id}
              href={`/categoria/${c.slug}`}
              onMouseEnter={() => c.children.length && openNow(c)}
              className={`group border-r border-b border-slate-200 px-4 py-6 flex flex-col items-center text-center transition-colors ${
                isOpen ? 'bg-slate-50' : 'hover:bg-slate-50'
              }`}
            >
              {/* Imagen en círculo con degradado suave detrás */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-50 to-slate-200/70 grid place-items-center overflow-hidden shrink-0">
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : c.icon ? (
                  <span className="text-4xl">{c.icon}</span>
                ) : (
                  <span className="text-3xl font-black text-brand-700">
                    {c.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Nombre: alto reservado para 2 líneas, así todas las
                  celdas miden lo mismo aunque el nombre sea largo. */}
              <div
                className={`mt-4 text-[13.5px] md:text-[14.5px] leading-snug line-clamp-2 transition-colors ${
                  isOpen ? 'text-brand-600 font-semibold' : 'text-slate-700 group-hover:text-brand-600'
                }`}
                style={{ minHeight: '2.6em' }}
              >
                {c.name}
              </div>

              {c.children.length > 0 && (
                <div className="text-[10.5px] text-slate-400 mt-0.5">
                  {c.children.length} subcategorías
                </div>
              )}
            </Link>
          )
        })}

        {/* Celdas vacías para cerrar la última fila */}
        {Array.from({ length: fillers }).map((_, i) => (
          <div
            key={`filler-${i}`}
            aria-hidden="true"
            className="hidden lg:block border-r border-b border-slate-200"
          />
        ))}
      </div>

      {/* ── Desplegable: subcategorías + productos ── */}
      {openCat && openCat.children.length > 0 && (
        <div
          className="hidden md:block absolute left-0 right-0 top-full mt-2 z-30"
          onMouseEnter={() => clearTimeout(closeTimer.current)}
          onMouseLeave={closeSoon}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card-hover p-5 grid grid-cols-[250px_1fr] gap-6 animate-fade-in-up">

            <div className="border-r border-slate-100 pr-5">
              <Link
                href={`/categoria/${openCat.slug}`}
                onClick={() => setOpenId(null)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-brand-700 hover:bg-brand-50"
              >
                Ver todo en {openCat.name}
              </Link>
              <div className="mt-1 max-h-[260px] overflow-y-auto">
                {openCat.children.map((sub) => (
                  <Link
                    key={sub._id}
                    href={`/categoria/${sub.slug}`}
                    onClick={() => setOpenId(null)}
                    className="block px-3 py-1.5 rounded-lg text-[13.5px] text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              {preview[openCat.slug] === undefined ? (
                <div className="grid grid-cols-4 gap-4">
                  {Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square rounded-xl bg-slate-100" />
                      <div className="h-3 bg-slate-100 rounded mt-2.5 w-4/5" />
                      <div className="h-3 bg-slate-100 rounded mt-1.5 w-2/5" />
                    </div>
                  ))}
                </div>
              ) : preview[openCat.slug].length === 0 ? (
                <div className="h-full grid place-items-center text-sm text-slate-400">
                  Explora las subcategorías de {openCat.name}
                </div>
              ) : (
                <>
                  <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-3">
                    Productos en {openCat.name}
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {preview[openCat.slug].map((p) => (
                      <Link
                        key={p._id}
                        href={`/productos/${p._id}`}
                        onClick={() => setOpenId(null)}
                        className="group/item"
                      >
                        <div className="aspect-square rounded-xl bg-slate-50 overflow-hidden border border-slate-100">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                            />
                          ) : null}
                        </div>
                        <div className="mt-2 text-[12.5px] text-slate-700 line-clamp-2 leading-snug group-hover/item:text-brand-700">
                          {p.name}
                        </div>
                        <div className="text-[12.5px] font-bold text-slate-900 mt-0.5">
                          {money(p.price)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
