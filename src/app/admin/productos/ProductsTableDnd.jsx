'use client'
// ============================================================
// Tabla de productos del admin con drag-and-drop para reordenar.
// Cuando no hay filtros activos, muestra un handle (⠿) en cada
// fila. El admin arrastra para cambiar el orden; al soltar se
// guarda automáticamente en /api/products/reorder.
// ============================================================
import { useState, useRef } from 'react'
import Link from 'next/link'
import FeaturedButton from './FeaturedButton'
import FlagButton from './FlagButton'
import DeleteProductButton from './DeleteProductButton'
import DuplicateButton from './DuplicateButton'
import Icon from '@/components/Icon'

function formatPrice(n) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(n)
}

export default function ProductsTableDnd({ initialProducts, canReorder }) {
  const [products, setProducts]       = useState(initialProducts)
  const [saving, setSaving]           = useState(false)
  const [savedOk, setSavedOk]         = useState(false)
  const [dragOverIdx, setDragOverIdx] = useState(null)
  const dragIdx = useRef(null)

  // ── Drag handlers ───────────────────────────────────────────
  function handleDragStart(e, idx) {
    dragIdx.current = idx
    e.dataTransfer.effectAllowed = 'move'
    // ghost image más pequeña
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20)
  }

  function handleDragEnd(e) {
    e.currentTarget.style.opacity = ''
    setDragOverIdx(null)
    dragIdx.current = null
  }

  function handleDragOver(e, idx) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIdx !== idx) setDragOverIdx(idx)
  }

  function handleDragLeave() {
    setDragOverIdx(null)
  }

  function handleDrop(e, idx) {
    e.preventDefault()
    setDragOverIdx(null)
    const from = dragIdx.current
    if (from === null || from === idx) return

    const next = [...products]
    const [moved] = next.splice(from, 1)
    next.splice(idx, 0, moved)
    setProducts(next)
    dragIdx.current = null
    persistOrder(next)
  }

  // ── Guardar en API ──────────────────────────────────────────
  async function persistOrder(prods) {
    setSaving(true)
    setSavedOk(false)
    try {
      const res = await fetch('/api/products/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: prods.map((p) => p._id) }),
      })
      if (res.ok) {
        setSavedOk(true)
        setTimeout(() => setSavedOk(false), 2500)
      }
    } catch {
      // silencioso — la lista local ya está actualizada
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
      {/* Banner de estado de guardado */}
      {(saving || savedOk) && (
        <div
          className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-colors ${
            saving
              ? 'bg-slate-100 text-slate-500'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {saving ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Guardando orden…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Orden guardado
            </>
          )}
        </div>
      )}

      {/* Hint cuando se puede reordenar */}
      {canReorder && (
        <div className="px-4 py-2 bg-brand-50 border-b border-brand-100 text-xs text-brand-700 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Arrastra las filas para cambiar el orden que verán los clientes en el catálogo.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-left">
            <tr>
              {canReorder && <th className="w-8 p-3" />}
              <th className="p-3">Producto</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Precio</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p, idx) => (
              <tr
                key={p._id}
                draggable={canReorder}
                onDragStart={canReorder ? (e) => handleDragStart(e, idx) : undefined}
                onDragEnd={canReorder ? handleDragEnd : undefined}
                onDragOver={canReorder ? (e) => handleDragOver(e, idx) : undefined}
                onDragLeave={canReorder ? handleDragLeave : undefined}
                onDrop={canReorder ? (e) => handleDrop(e, idx) : undefined}
                className={`transition-colors ${
                  dragOverIdx === idx
                    ? 'bg-brand-50 border-t-2 border-brand-400'
                    : 'hover:bg-slate-50'
                } ${canReorder ? 'cursor-default' : ''}`}
              >
                {/* Drag handle */}
                {canReorder && (
                  <td className="p-3 w-8">
                    <div
                      className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing select-none text-center leading-none"
                      title="Arrastra para reordenar"
                    >
                      {/* Grip icon — 6 puntos */}
                      <svg className="w-4 h-4 mx-auto" viewBox="0 0 16 16" fill="currentColor">
                        <circle cx="5" cy="4" r="1.2"/>
                        <circle cx="5" cy="8" r="1.2"/>
                        <circle cx="5" cy="12" r="1.2"/>
                        <circle cx="11" cy="4" r="1.2"/>
                        <circle cx="11" cy="8" r="1.2"/>
                        <circle cx="11" cy="12" r="1.2"/>
                      </svg>
                    </div>
                  </td>
                )}

                {/* Imagen + nombre */}
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 grid place-items-center text-slate-300">
                      {p.image ? (
                        <img src={p.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="box" className="w-6 h-6" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {p.flagged && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-amber-400" title="Pendiente de revisar" />
                        )}
                        <div className="font-semibold text-slate-900 line-clamp-1">{p.name}</div>
                      </div>
                      {p.sku ? (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</div>
                      ) : (
                        <div className="text-xs text-slate-400 line-clamp-1">{p.description}</div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Categorías */}
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {p.categories?.length > 0
                      ? p.categories.map((c) => (
                          <span
                            key={c._id}
                            className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap"
                          >
                            {c.name}
                          </span>
                        ))
                      : '—'}
                  </div>
                </td>

                {/* Precio */}
                <td className="p-3 font-semibold">{formatPrice(p.price)}</td>

                {/* Stock */}
                <td className="p-3">
                  <span className={p.stock !== null && p.stock < 5 ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                    {p.stock === null ? '∞' : p.stock}
                  </span>
                </td>

                {/* Estado */}
                <td className="p-3">
                  {p.active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                      Publicado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                      Oculto
                    </span>
                  )}
                </td>

                {/* Acciones */}
                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                    <FeaturedButton id={p._id} featured={!!p.featured} />
                    <FlagButton id={p._id} flagged={!!p.flagged} />
                    <Link
                      href={`/admin/productos/${p._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                    >
                      <Icon name="edit" className="w-3.5 h-3.5" />
                      Editar
                    </Link>
                    <DuplicateButton id={p._id} />
                    <DeleteProductButton id={p._id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}

            {products.length === 0 && (
              <tr>
                <td colSpan={canReorder ? 7 : 6} className="p-10 text-center text-slate-500">
                  No hay productos aún.{' '}
                  <Link href="/admin/productos/nuevo" className="text-brand-700 font-semibold hover:underline">
                    Crea el primero
                  </Link>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
