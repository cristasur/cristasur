// 404 personalizada
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4 text-center">
      <div>
        <div className="text-7xl mb-4">🔎</div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900">
          No encontramos lo que buscas
        </h1>
        <p className="text-slate-500 mt-2">
          El producto o página que intentas ver ya no existe.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
