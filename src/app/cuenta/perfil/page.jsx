'use client'
// /cuenta/perfil — Editar perfil del cliente
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function EditarPerfilPage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setForm((f) => ({
            ...f,
            name: data.user.name || '',
            phone: data.user.phone || '',
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
    setSuccess('')
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccess('')
    setError('')

    if (form.newPassword || form.currentPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword) {
        setError('Las contraseñas nuevas no coinciden.')
        return
      }
      if (form.newPassword && form.newPassword.length < 6) {
        setError('La nueva contraseña debe tener al menos 6 caracteres.')
        return
      }
    }

    setSaving(true)
    try {
      const body = {
        name: form.name,
        phone: form.phone,
      }
      if (form.newPassword) {
        body.currentPassword = form.currentPassword
        body.newPassword = form.newPassword
      }

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ocurrió un error. Intenta de nuevo.')
      } else {
        setSuccess('Perfil actualizado correctamente.')
        setForm((f) => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }))
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="h-8 bg-slate-100 rounded animate-pulse mb-4 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/cuenta"
          className="text-slate-500 hover:text-slate-900 text-sm flex items-center gap-1"
        >
          ← Mi cuenta
        </Link>
      </div>

      <h1 className="text-2xl font-black text-slate-900 mb-6">Editar perfil</h1>

      {success && (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 text-sm font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
            Datos personales
          </h2>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Tu nombre completo"
              maxLength={120}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Ej. 9991234567"
              maxLength={30}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4">
          <h2 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
            Cambiar contraseña
          </h2>
          <p className="text-xs text-slate-500">Deja estos campos en blanco si no deseas cambiar tu contraseña.</p>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => set('currentPassword', e.target.value)}
              autoComplete="current-password"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(e) => set('newPassword', e.target.value)}
              autoComplete="new-password"
              minLength={6}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Confirmar nueva contraseña
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold transition-colors"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
