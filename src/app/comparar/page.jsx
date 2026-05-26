'use client'
import Link from 'next/link'
import { useCompare } from '@/components/CompareProvider'
import { useCart } from '@/components/CartProvider'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n || 0)
}

const ATTRIBUTES = [
  { key: 'image', label: 'Imagen' },
  { key: 'name', label: 'Nombre' },
  { key: 'price', label: 'Precio' },
  { key: 'wholesalePrice', label: 'Precio Mayoreo' },
  { key: 'categories', label: 'Categorías' },
  { key: 'stock', label: 'Stock' },
  { key: 'description', label: 'Descripción' },
]

function CellValue({ attr, product }) {
  if (attr === 'image') {
    return product.image ? (
      <img
        src={product.image}
        alt={product.name}
        className="w-24 h-24 object-cover rounded-xl mx-auto"
      />
    ) : (
      <div className="w-24 h-24 bg-slate-100 rounded-xl mx-auto flex items-center justify-center text-slate-300 text-xs">
        Sin imagen
      </div>
    )
  }
  if (attr === 'price') return <span className="font-bold text-lg">{formatPrice(product.price)}</span>
  if (attr === 'wholesalePrice') {
    if (!product.wholesalePrice) return <span className="text-slate-400">—</span>
    return (
      <span className="text-amber-700 font-semibold">
        {formatPrice(product.wholesalePrice)}
        {product.wholesaleMinQty && (
          <span className="block text-xs text-slate-500">desde {product.wholesaleMinQty} pzs</span>
        )}
      </span>
    )
  }
  if (attr === 'categories') {
    const cats = product.categories?.map((c) => c.name || c).filter(Boolean) || []
    return cats.length ? (
      <div className="flex flex-wrap gap-1 justify-center">
        {cats.map((c, i) => (
          <span key={i} className="text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2 py-0.5">
            {c}
          </span>
        ))}
      </div>
    ) : <span className="text-slate-400">—</span>
  }
  if (attr === 'stock') {
    if (product.stock === undefined || product.stock === null) return <span className="text-slate-400">Ilimitado</span>
    if (product.stock === 0) return <span className="text-rose-600 font-semibold">Sin stock</span>
    return <span className="text-emerald-700 font-semibold">{product.stock} disponibles</span>
  }
  if (attr === 'description') {
    return product.description ? (
      <p className="text-sm text-slate-600 text-left line-clamp-4">{product.description}</p>
    ) : <span className="text-slate-400">—</span>
  }
  if (attr === 'name') return <span className="font-semibold text-slate-900">{product.name}</span>
  return <span>{product[attr] ?? '—'}</span>
}

export default function CompararPage() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare()
  const { addItem } = useCart()

  if (compareItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-6xl">⚖️</div>
        <h1 className="text-2xl font-black text-slate-900">Selecciona productos para comparar</h1>
        <p className="text-slate-600 max-w-sm">
          Agrega hasta 3 productos desde el catálogo para compararlos lado a lado.
        </p>
        <Link
          href="/productos"
          className="mt-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors"
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Comparar productos</h1>
          <p className="text-slate-500 text-sm mt-1">{compareItems.length} producto{compareItems.length !== 1 ? 's' : ''} seleccionado{compareItems.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearCompare}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-rose-300 hover:text-rose-600 transition-colors"
          >
            Limpiar todo
          </button>
          <Link
            href="/productos"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors"
          >
            + Agregar producto
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-32" />
            {compareItems.map((_, i) => <col key={i} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="p-3 text-left text-xs uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-200" />
              {compareItems.map((product) => (
                <th key={product._id} className="p-3 border-b border-slate-200">
                  <div className="flex flex-col items-center gap-2">
                    <Link
                      href={`/productos/${product._id}`}
                      className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors text-center line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addItem({
                          productId: product._id,
                          name: product.name,
                          price: product.price,
                          wholesalePrice: product.wholesalePrice,
                          wholesaleMinQty: product.wholesaleMinQty,
                          image: product.image,
                          categoryIds: product.categories?.map((c) => c._id || c) || [],
                        })}
                        className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors"
                      >
                        Agregar al carrito
                      </button>
                      <button
                        onClick={() => removeFromCompare(product._id)}
                        className="px-2 py-1.5 rounded-lg border border-slate-200 hover:border-rose-300 hover:text-rose-600 text-slate-500 text-xs transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ATTRIBUTES.map((attr, rowIdx) => (
              <tr
                key={attr.key}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
              >
                <td className="p-3 text-sm font-semibold text-slate-600 border-b border-slate-100 align-top whitespace-nowrap">
                  {attr.label}
                </td>
                {compareItems.map((product) => (
                  <td
                    key={product._id}
                    className="p-3 text-sm text-slate-700 border-b border-slate-100 text-center align-top"
                  >
                    <CellValue attr={attr.key} product={product} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
