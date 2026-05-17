'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function isoDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return ''
  // YYYY-MM-DD para input[type=date]
  return dt.toISOString().slice(0, 10)
}

export default function CouponForm({ initial, categories = [], products = [] }) {
  const isEdit = Boolean(initial?._id)
  const [form, setForm] = useState({
    code: initial?.code || '',
    description: initial?.description || '',
    type: initial?.type || 'percent',
    value: initial?.value ?? 10,
    minSubtotal: initial?.minSubtotal ?? 0,
    usageLimit: initial?.usageLimit ?? 0,
    active: initial?.active !== false,
    startsAt: isoDate(initial?.startsAt),
    endsAt: isoDate(initial?.endsAt),
    categories: Array.isArray(initial?.categories) ? initial.categories.map(String) : [],
    products: Array.isArray(initial?.products) ? initial.products.map(String) : [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function toggleArray(key, id) {
    setForm((f) => {
      const has = f[key].includes(id)
      return { ...f, [key]: has ? f[key].filter((x) => x !== id) : [...f[key], id] }
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = isEdit ? `/api/coupons/${initial._id}` : '/api/coupons'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Error al guardar')
        return
      }
      router.push('/admin/cupones')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function onDelete() {
    if (!confirm('¿Eliminar este cupón definitivamente?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/coupons/${initial._id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || 'Error al eliminar')
        return
      }
      router.push('/admin/cupones')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Código" required>
          <input
            type="text"
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            placeholder="VERANO20"
            maxLength={30}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:outline-none focus:border-brand-500"
            required
          />
        </Field>
        <Field label="Descripción">
          <input
            type="text"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="20% de descuento en temporada de verano"
            maxLength={200}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Tipo">
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand-500"
          >
            <option value="percent">Porcentaje (%)</option>
            <option value="fixed">Monto fijo ($)</option>
          </select>
        </Field>
        <Field label={form.type === 'percent' ? 'Porcentaje' : 'Monto'}>
          <input
            type="number"
            min={0}
            step={form.type === 'percent' ? 1 : 0.01}
            value={form.value}
            onChange={(e) => set('value', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </Field>
        <Field label="Subtotal mínimo">
          <input
            type="number"
            min={0}
            step={1}
            value={form.minSubtotal}
            onChange={(e) => set('minSubtotal', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Vigencia desde">
          <input
            type="date"
            value={form.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </Field>
        <Field label="Vigencia hasta">
          <input
            type="date"
            value={form.endsAt}
            onChange={(e) => set('endsAt', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </Field>
        <Field label="Límite de usos (0 = ilimitado)">
          <input
            type="number"
            min={0}
            step={1}
            value={form.usageLimit}
            onChange={(e) => set('usageLimit', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </Field>
      </div>

      <Field label="Restringir a categorías (opcional)">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const checked = form.categories.includes(String(c._id))
            return (
              <button
                type="button"
                key={c._id}
                onClick={() => toggleArray('categories', String(c._id))}
                className={
                  'px-3 py-1 rounded-full text-xs font-semibold border ' +
                  (checked
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-brand-400')
                }
              >
                {c.icon} {c.name}
              </button>
            )
          })}
          {!categories.length && (
            <span className="text-xs text-slate-500">Sin categorías disponibles</span>
          )}
        </div>
      </Field>

      <Field label="Restringir a productos específicos (opcional)">
        <select
          multiple
          size={6}
          value={form.products}
          onChange={(e) =>
            set(
              'products',
              Array.from(e.target.selectedOptions).map((o) => o.value)
            )
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
        >
          {products.map((p) => (
            <option key={p._id} value={String(p._id)}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          Ctrl/Cmd + clic para seleccionar varios. Deja vacío si aplica a todo.
        </p>
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => set('active', e.target.checked)}
          className="w-4 h-4"
        />
        <span>Cupón activo</span>
      </label>

      <div className="flex flex-wrap justify-between gap-3 pt-4 border-t border-slate-100">
        {isEdit && (
          <button
            type="button"
            onClick={onDelete}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold disabled:opacity-60"
          >
            Eliminar cupón
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => router.push('/admin/cupones')}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
          >
            {loading ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear cupón'}
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  )
}
