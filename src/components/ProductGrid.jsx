// Grid responsive de productos
import ProductCard from './ProductCard'
import Icon from './Icon'

export default function ProductGrid({ products, colorFilter }) {
  if (!products?.length) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 text-slate-400 grid place-items-center mb-4">
          <Icon name="search" className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800 mb-1">Sin resultados</h3>
        <p className="text-slate-500">
          No encontramos productos con esos criterios. Prueba con otra búsqueda o categoría.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((p) => (
        <ProductCard key={p._id} product={p} colorFilter={colorFilter} />
      ))}
    </div>
  )
}
