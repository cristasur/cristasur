// /cuenta/verificar-email — Estado de verificación de correo
'use client'
import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function VerificarEmailContent() {
  const params = useSearchParams()
  const status = params.get('status')

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-black text-slate-900">¡Email confirmado!</h1>
          <p className="text-slate-500 text-sm mt-2">Tu cuenta está activa. Ya puedes disfrutar de todos los beneficios.</p>
          <Link
            href="/cuenta"
            className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition"
          >
            Ir a mi cuenta
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black text-slate-900">Enlace inválido</h1>
          <p className="text-slate-500 text-sm mt-2">El enlace no es válido o ya fue usado. Si ya confirmaste tu correo, puedes iniciar sesión normalmente.</p>
          <Link
            href="/cuenta"
            className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition"
          >
            Ir a mi cuenta
          </Link>
        </div>
      </div>
    )
  }

  // Pending state (just registered)
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8 text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-black text-slate-900">Confirma tu correo</h1>
        <p className="text-slate-500 text-sm mt-2">Te enviamos un enlace de confirmación. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.</p>
        <Link
          href="/cuenta"
          className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition"
        >
          Ir a mi cuenta
        </Link>
      </div>
    </div>
  )
}

export default function VerificarEmailPage() {
  return (
    <Suspense>
      <VerificarEmailContent />
    </Suspense>
  )
}
