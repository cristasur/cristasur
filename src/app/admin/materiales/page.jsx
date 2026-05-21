'use client'
import { useState, useEffect } from 'react'

export default function AdminMaterialesPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/materials?all=1')
      const data = await res.json()
      setMaterials(data.materials || [])
    } catch { setError('Error al cargar') } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setNewName(''); await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function handleUpdate(id, updates) {
    try {
      const res = await fetch(`/api/materials/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setEditing(null); await load()
    } catch (err) { setError(err.message) }
  }

  async function handleDelete(id, name) {
    if (!confirm(`¿Eliminar el material "${name}"?`)) return
    await fetch(`/api/materials/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Materiales</h1>
        <p className="text-slate-500 text-sm mt-1">Administra los materiales asignables a productos (plástico, vidrio, acero…).</p>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-6">
        <h2 className="font-bold text-slate-900 mb-3">Añadir material</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre del material…" className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-brand-400" />
          <button type="submit" disabled={saving || !newName.trim()} className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm disabled:opacity-50">
            {saving ? 'Guardando…' : 'Añadir'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Materiales registrados</h2>
        </div>
        {loading ? (
          <div className="p-10 text-center text-slate-400">Cargando…</div>
        ) : materials.length === 0 ? (
          <div className="p-10 text-center text-slate-400">No hay materiales aún.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {materials.map((m) => (
              <div key={m._id} className="flex items-center gap-3 px-6 py-3">
                {editing?.id === m._id ? (
                  <form className="flex-1 flex gap-2" onSubmit={e => { e.preventDefault(); handleUpdate(m._id, { name: editing.name }) }}>
                    <input autoFocus type="text" value={editing.name} onChange={e => setEditing(ed => ({ ...ed, name: e.target.value }))} className="flex-1 px-2 py-1 rounded border border-brand-400 text-sm focus:outline-none" />
                    <button type="submit" className="px-3 py-1 rounded bg-brand-600 text-white text-xs font-bold">Guardar</button>
                    <button type="button" onClick={() => setEditing(null)} className="px-3 py-1 rounded bg-slate-100 text-slate-600 text-xs">Cancelar</button>
                  </form>
                ) : (
                  <div className="flex-1">
                    <span className="font-semibold text-slate-900">{m.name}</span>
                    <span className="ml-2 text-xs text-slate-400">/{m.slug}</span>
                  </div>
                )}
                <input type="number" defaultValue={m.order} min={0} className="w-16 px-2 py-1 rounded border border-slate-200 text-sm text-center" onBlur={e => handleUpdate(m._id, { order: Number(e.target.value) })} />
                <button onClick={() => handleUpdate(m._id, { active: !m.active })} className={`px-3 py-1 text-xs font-semibold rounded-lg ${m.active ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {m.active ? 'Activo' : 'Inactivo'}
                </button>
                {editing?.id !== m._id && (
                  <button onClick={() => setEditing({ id: m._id, name: m.name })} className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700">Editar</button>
                )}
                <button onClick={() => handleDelete(m._id, m.name)} className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 text-red-600">Eliminar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
