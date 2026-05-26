'use client'
// ============================================================
// Error boundary global. Evita la pantalla blanca de Next
// cuando algo falla (ej. MongoDB caído / DNS sin resolver).
// ============================================================
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isDbError =
    /ECONNREFUSED|querySrv|ENOTFOUND|MongoNetworkError|MongooseServerSelectionError/i.test(
      error?.message || ''
    )

  return (
    <div className="min-h-[60vh] grid place-items-center px-4">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-card p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 text-rose-600 grid place-items-center mb-4 text-2xl">
          !
        </div>
        <h1 className="text-2xl font-black text-slate-900">
          {isDbError ? 'No pudimos conectar con la base de datos' : 'Algo salió mal'}
        </h1>
        <p className="mt-2 text-slate-600">
          {isDbError
            ? 'Revisa tu conexión a internet y que la base de datos esté disponible. Si usas MongoDB Atlas, verifica que el cluster no esté pausado y que tu IP esté autorizada.'
            : 'Intenta de nuevo en unos segundos. Si el problema continúa, contáctanos.'}
        </p>

        {process.env.NODE_ENV !== 'production' && error?.message && (
          <pre className="mt-4 text-left text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto text-slate-600">
            {error.message}
          </pre>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
