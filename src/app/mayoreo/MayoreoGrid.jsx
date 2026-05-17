'use client'
// Grid de productos para la vista mayoreo VIP.
// Cada card muestra el wholesalePrice como precio único (sin cantidad mínima).
// Si un producto no tiene wholesalePrice, mostramos el precio normal
// indicado como "precio público".
import { useMemo, useState } from 'react'
import Link from 'next/link'
import Icon from '@/components/Icon'
import { useCart } from '@/components/CartProvider'

function formatMXN(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n || 0)
}

export default function MayoreoGrid({ products, categories }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const { addItem, setOpen } = useCart()

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim()
    return products.filter((p) => {
      if (cat && !(p.categories || []).some((c) => c.slug === cat || c._id === cat)) return false
      if (!term) return true
      return p.name?.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term)
    })
  }, [products, q, cat])

  function addToCartMayoreo(p) {
    const hasWholesale = p.wholesalePrice && Number(p.wholesalePrice) > 0
    const unit = hasWholesale ? Number(p.wholesalePrice) : Number(p.price)
    addItem(
      {
        productId: String(p._id),
        name: p.name,
        // En la vista mayoreo, el "precio" que ve el carrito ES el de mayoreo.
        // No imponemos cantidad mínima.
        price: unit,
        wholesalePrice: null,
        wholesaleMinQty: null,
        image: p.image || '',
        variantLabel: '',
        variantValue: hasWholesale ? 'Mayoreo VIP' : '',
        categoryIds: Array.isArray(p.categories)
          ? p.categories.map((c) => String(c?._id || c))
          : [],
      },
      1
    )
    setOpen(true)
  }

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c._id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const hasWholesale = p.wholesalePrice && Number(p.wholesalePrice) > 0
          const price = hasWholesale ? Number(p.wholesalePrice) : Number(p.price)
          const saving = hasWholesale ? Number(p.price) - Number(p.wholesalePrice) : 0
          return (
            <article
              key={p._id}
              className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex flex-col"
            >
              <Link href={`/productos/${p._id}`} className="block">
                <div className="aspect-square bg-slate-50 overflow-hidden">
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-300">
                      <Icon name="box" className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  {p.categories?.[0]?.name && (
                    <div className="text-[10px] uppercase tracking-wider text-amber-700 font-bold">
                      {p.categories[0].name}
                    </div>
                  )}
                  <h3 className="font-semibold text-slate-900 line-clamp-2 text-sm leading-snug">
                    {p.name}
                  </h3>
                  <div className="mt-2">
                    <div className="text-xl font-black text-amber-600">{formatMXN(price)}</div>
                    {hasWholesale ? (
                      <div className="text-[11px] text-slate-500">
                        Precio público <span className="line-through">{formatMXN(p.price)}</span>
                        {saving > 0 && (
                          <span className="ml-1 text-emerald-700 font-bold">
                            (−{formatMXN(saving)} por pieza)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500">
                        Precio público — sin mayoreo configurado
                      </div>
                    )}
                  </div>
                </div>
              </Link>
              <div className="px-3 pb-3 mt-auto">
                <button
                  onClick={() => addToCartMayoreo(p)}
                  disabled={p.stock === 0}
                  className={
                    'w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold ' +
                    (p.stock === 0
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500 hover:bg-amber-600 text-white')
                  }
                >
                  <Icon name="cart" className="w-4 h-4" />
                  {p.stock === 0 ? 'Sin stock' : 'Añadir al carrito'}
                </button>
              </div>
            </article>
          )
        })}
        {!filtered.length && (
          <p className="col-span-full text-center text-slate-500 py-10">
            Sin productos para esos filtros.
          </p>
        )}
      </div>
    </div>
  )
}
