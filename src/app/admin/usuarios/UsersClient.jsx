'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from '@/components/Icon'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function UsersClient({ initialUsers, meId }) {
  const [users, setUsers] = useState(initialUsers)
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'editor' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function createUser(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Error al crear')
        return
      }
      setUsers((xs) => [data.user, ...xs])
      setForm({ email: '', password: '', name: '', role: 'editor' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(id, role) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data?.error || 'Error al actualizar')
      return
    }
    setUsers((xs) => xs.map((u) => (u._id === id ? { ...u, role } : u)))
  }

  // Tracking de qué fila está guardando o acaba de guardar (para feedback visual)
  const [savingWholesale, setSavingWholesale] = useState({}) // { [id]: 'saving' | 'ok' | 'err' }

  async function toggleWholesale(id, wholesaleAccess) {
    setSavingWholesale((s) => ({ ...s, [id]: 'saving' }))
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wholesaleAccess }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSavingWholesale((s) => ({ ...s, [id]: 'err' }))
        alert(data?.error || 'Error al actualizar acceso mayoreo')
        return
      }
      // Si el backend devuelve user, confiamos en su valor. Si no, usamos el optimista.
      const updated = data?.user?.wholesaleAccess ?? wholesaleAccess
      setUsers((xs) =>
        xs.map((u) => (u._id === id ? { ...u, wholesaleAccess: updated } : u))
      )
      setSavingWholesale((s) => ({ ...s, [id]: 'ok' }))
      // Limpiamos el badge "Guardado" después de 1.6s
      setTimeout(() => {
        setSavingWholesale((s) => {
          const n = { ...s }
          delete n[id]
          return n
        })
      }, 1600)
    } catch (e) {
      setSavingWholesale((s) => ({ ...s, [id]: 'err' }))
      alert('Error de red al actualizar acceso mayoreo')
    }
  }

  async function resetPassword(id) {
    const p = prompt('Nueva contraseña (mínimo 8 caracteres):')
    if (!p) return
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: p }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data?.error || 'Error al cambiar contraseña')
      return
    }
    alert('Contraseña actualizada.')
  }

  async function deleteUser(id) {
    if (!confirm('¿Eliminar esta cuenta?')) return
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(data?.error || 'Error al eliminar')
      return
    }
    setUsers((xs) => xs.filter((u) => u._id !== id))
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5">
        <h2 className="font-bold text-slate-900 mb-3">Crear usuario</h2>
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-sm mb-3">
            {error}
          </div>
        )}
        <form onSubmit={createUser} className="grid md:grid-cols-4 gap-3">
          <input
            type="email"
            required
            placeholder="email@dominio.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
          <input
            type="text"
            placeholder="Nombre (opcional)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Contraseña (mín. 8)"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500"
          />
          <div className="flex gap-2">
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-brand-500"
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold disabled:opacity-60"
            >
              Crear
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Mayoreo VIP</th>
                <th className="p-3">Último acceso</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isMe = String(u._id) === String(meId)
                return (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">
                      {u.email}
                      {isMe && (
                        <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                          TÚ
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">{u.name || '—'}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        disabled={isMe}
                        onChange={(e) => updateRole(u._id, e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded bg-white text-xs disabled:opacity-60"
                      >
                        <option value="customer">Cliente</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <WholesaleToggle
                        active={!!u.wholesaleAccess}
                        state={savingWholesale[u._id]}
                        onToggle={() => toggleWholesale(u._id, !u.wholesaleAccess)}
                      />
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {formatDate(u.lastLoginAt)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => resetPassword(u._id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                        >
                          Cambiar contraseña
                        </button>
                        {!isMe && (
                          <button
                            onClick={() => deleteUser(u._id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// Botón explícito para otorgar/quitar acceso mayoreo VIP. Muestra
// claramente el estado actual y feedback de guardado.
function WholesaleToggle({ active, state, onToggle }) {
  const isSaving = state === 'saving'
  const isOk = state === 'ok'
  const isErr = state === 'err'

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={onToggle}
        disabled={isSaving}
        title={active ? 'Quitar acceso mayoreo VIP' : 'Otorgar acceso mayoreo VIP'}
        className={
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold border transition ' +
          (active
            ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200') +
          (isSaving ? ' opacity-60 cursor-wait' : '')
        }
      >
        <span
          aria-hidden="true"
          className={
            'inline-block w-3 h-3 rounded-full ' +
            (active ? 'bg-amber-500' : 'bg-slate-400')
          }
        />
        {active ? 'VIP activo' : 'Otorgar VIP'}
      </button>
      {isSaving && <span className="text-[10px] text-slate-500">guardando…</span>}
      {isOk && <span className="text-[10px] text-emerald-700 font-bold">✓ guardado</span>}
      {isErr && <span className="text-[10px] text-rose-600 font-bold">✕ error</span>}
    </div>
  )
}
