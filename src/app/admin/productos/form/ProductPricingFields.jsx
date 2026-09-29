'use client'

export default function ProductPricingFields({ form, update, input }) {
  return (<>
      <div className="grid md:grid-cols-3 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Precio (MXN) *</span>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            className={input}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Precio anterior (opcional)
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.comparePrice}
            onChange={(e) => update('comparePrice', e.target.value)}
            className={input}
          />
          <span className="text-xs text-slate-500">
            Se mostrará tachado para indicar descuento.
          </span>
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Disponibilidad</span>
          {(() => {
            const stockMode =
              form.stock === '' || form.stock === null
                ? 'disponible'
                : Number(form.stock) === 0
                ? 'agotado'
                : 'cantidad'
            return (
              <>
                <div className="flex gap-2 flex-wrap mt-1">
                  {[
                    { val: 'disponible', label: '✅ Disponible' },
                    { val: 'agotado',    label: '❌ Sin stock'  },
                    { val: 'cantidad',   label: '🔢 Cantidad'   },
                  ].map(({ val, label }) => (
                    <label
                      key={val}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition text-sm ${
                        stockMode === val
                          ? 'border-brand-500 bg-brand-50 text-brand-800 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="stockMode"
                        checked={stockMode === val}
                        onChange={() => {
                          if (val === 'disponible') update('stock', '')
                          else if (val === 'agotado') update('stock', 0)
                          else update('stock', form.stock > 0 ? form.stock : 1)
                        }}
                        className="w-4 h-4 accent-brand-600"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {stockMode === 'cantidad' && (
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 50"
                    value={form.stock}
                    onChange={(e) => update('stock', e.target.value)}
                    className={input}
                  />
                )}
              </>
            )
          })()}
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Vender de <span className="text-brand-600 font-semibold">N en N</span> <span className="text-slate-400 font-normal">(opcional)</span></span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Ej: 3, 6, 12 — vacío = de 1 en 1"
            value={form.qtyStep}
            onChange={(e) => update('qtyStep', e.target.value)}
            className={input}
          />
          <span className="text-xs text-slate-500">
            {form.qtyStep && Number(form.qtyStep) > 1
              ? `El cliente podrá pedir: ${[1,2,3].map(n => n * Number(form.qtyStep)).join(', ')}…`
              : 'Dejar vacío para vender de 1 en 1.'}
          </span>
        </label>
      </div>

      {/* Precio mayoreo (opcional) */}
      <fieldset className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-amber-800">
          Precio mayoreo (opcional)
        </legend>
        <p className="text-xs text-amber-800/80 mb-3">
          Si rellenas estos dos campos, los clientes verán también un precio de
          mayoreo y se aplicará automáticamente cuando añadan al carrito una
          cantidad igual o mayor a la mínima.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Precio mayoreo (MXN)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.wholesalePrice}
              onChange={(e) => update('wholesalePrice', e.target.value)}
              className={input}
              placeholder="Debe ser menor al precio normal"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Cantidad mínima para mayoreo
            </span>
            <input
              type="number"
              min="2"
              step="1"
              value={form.wholesaleMinQty}
              onChange={(e) => update('wholesaleMinQty', e.target.value)}
              className={input}
              placeholder="Ej. 10"
            />
            <span className="text-xs text-slate-500">
              Desde esa cantidad por producto se aplica el precio mayoreo.
            </span>
          </label>
        </div>
        {form.wholesalePrice && form.price &&
          Number(form.wholesalePrice) >= Number(form.price) && (
          <p className="mt-2 text-xs text-rose-600">
            El precio de mayoreo debe ser menor al precio normal.
          </p>
        )}
      </fieldset>

      {/* Precio por ciento (tercer precio — sin funcionalidad activa aún) */}
      <fieldset className="border border-violet-200 bg-violet-50/30 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-violet-800">
          Precio por ciento <span className="font-normal text-violet-500 text-xs">(tercer precio — próximamente)</span>
        </legend>
        <p className="text-xs text-violet-700/80 mb-3">
          Para clientes que compran 100 piezas o más. Solo se guarda por ahora — la lógica automática se activará próximamente.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Precio por ciento (MXN)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.bulkPrice}
              onChange={(e) => update('bulkPrice', e.target.value)}
              className={input}
              placeholder="Debe ser menor al precio normal"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Cantidad mínima
            </span>
            <input
              type="number"
              min="2"
              step="1"
              value={form.bulkMinQty}
              onChange={(e) => update('bulkMinQty', e.target.value)}
              className={input}
              placeholder="Ej. 100"
            />
            <span className="text-xs text-slate-500">
              Desde esa cantidad se aplicará el precio por ciento.
            </span>
          </label>
        </div>
        {form.bulkPrice && form.price &&
          Number(form.bulkPrice) >= Number(form.price) && (
          <p className="mt-2 text-xs text-rose-600">
            El precio por ciento debe ser menor al precio normal.
          </p>
        )}
      </fieldset>

      <div className="grid md:grid-cols-2 gap-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">SKU (opcional)</span>
          <div className="mt-1 flex gap-2">
            <input
              value={form.sku}
              onChange={(e) => update('sku', e.target.value)}
              className={input + ' flex-1'}
              placeholder="Ej. COC-0001"
            />
            <button
              type="button"
              onClick={async () => {
                const categoryId = form.categories[0] || ''
                const res = await fetch(
                  `/api/products/sku-suggest?categoryId=${encodeURIComponent(categoryId)}`
                )
                const data = await res.json().catch(() => ({}))
                if (data?.sku) update('sku', data.sku)
              }}
              className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold whitespace-nowrap"
            >
              Generar
            </button>
          </div>
        </label>

        <div className="flex items-center gap-6 mt-6">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => update('featured', e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">🔥 Destacado</span>
          </label>
          <label className="inline-flex items-center gap-2" title="Si lo desactivas, el producto se oculta del catálogo aunque esté publicado.">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => {
                const next = e.target.checked
                setForm((f) => ({
                  ...f,
                  active: next,
                  // Si activas Visible y todavía está en borrador, lo pasamos a publicado
                  // automáticamente para que no quede en limbo (publicar=visible al cliente).
                  status: next && f.status === 'draft' ? 'published' : f.status,
                }))
              }}
              className="w-4 h-4"
            />
            <span className="text-sm text-slate-700">Visible en el catálogo</span>
          </label>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Para sacar un producto de <b>Borradores</b>, cambia el <b>Estado</b> a “Publicado” en la
          sección <i>Visibilidad y etiquetas</i> más abajo.
        </p>
      </div>


  </>)
}
