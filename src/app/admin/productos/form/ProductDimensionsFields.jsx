'use client'

export default function ProductDimensionsFields({ form, update, input }) {
  return (<>
      {/* ── Dimensiones del PRODUCTO (visibles al cliente) ── */}
      <fieldset className="border border-slate-200 bg-slate-50/40 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-slate-700">
          📐 Dimensiones del producto
        </legend>
        <p className="text-xs text-slate-500 mb-4">
          Medidas reales del producto. Se muestran <strong>públicamente</strong> en la ficha para que el cliente sepa el tamaño.
          Peso en <strong>kg</strong>, dimensiones en <strong>cm</strong>.
        </p>

        {/* Capacidad (opcional) */}
        <div className="mb-4">
          <span className="text-sm font-semibold text-slate-700 block mb-1">
            Capacidad <span className="font-normal text-slate-400">(opcional — para termos, vasos, botellitas…)</span>
          </span>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="0"
              step="any"
              placeholder="Ej: 500"
              value={form.capacity}
              onChange={(e) => update('capacity', e.target.value)}
              className="w-32 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none text-sm"
            />
            <select
              value={form.capacityUnit}
              onChange={(e) => update('capacityUnit', e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:outline-none text-sm bg-white"
            >
              {['L', 'mL', 'oz', 'fl oz', 'gal', 'cl', 'cc'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            {form.capacity && (
              <span className="text-sm text-slate-500">
                = {form.capacity} {form.capacityUnit}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Peso (kg)</span>
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="Ej: 1.500"
              value={form.weight}
              onChange={(e) => update('weight', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Largo (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 30.0"
              value={form.length}
              onChange={(e) => update('length', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Ancho (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 20.0"
              value={form.width}
              onChange={(e) => update('width', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Alto (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 15.0"
              value={form.height}
              onChange={(e) => update('height', e.target.value)}
              className={input}
            />
          </label>
        </div>
      </fieldset>

      {/* ── Caja para envío / logística (USO INTERNO — no se muestra al cliente) ── */}
      <fieldset className="border border-blue-200 bg-blue-50/30 rounded-xl p-4">
        <legend className="px-2 text-sm font-bold text-blue-800">
          📦 Caja para envío <span className="font-normal text-blue-600">(uso interno)</span>
        </legend>
        <p className="text-xs text-blue-700/80 mb-4">
          Dimensiones de la <strong>caja lista para embarcar</strong> (producto + embalaje).
          <strong> No se muestran al cliente.</strong> Se usan para cotizar con envia.com.
          Si vendes de <strong>{form.qtyStep > 1 ? form.qtyStep : 'N'} en {form.qtyStep > 1 ? form.qtyStep : 'N'}</strong>, pon aquí las medidas de la caja completa que sale del almacén.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Peso caja (kg)</span>
            <input
              type="number"
              min="0"
              step="0.001"
              placeholder="Ej: 2.000"
              value={form.pkgWeight}
              onChange={(e) => update('pkgWeight', e.target.value)}
              className={input}
            />
            <span className="text-[11px] text-slate-400">Con embalaje</span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Largo caja (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 40.0"
              value={form.pkgLength}
              onChange={(e) => update('pkgLength', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Ancho caja (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 30.0"
              value={form.pkgWidth}
              onChange={(e) => update('pkgWidth', e.target.value)}
              className={input}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Alto caja (cm)</span>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Ej: 25.0"
              value={form.pkgHeight}
              onChange={(e) => update('pkgHeight', e.target.value)}
              className={input}
            />
          </label>
        </div>

        <label className="block mt-4">
          <span className="text-sm font-semibold text-slate-700">Nota interna</span>
          <input
            type="text"
            placeholder="Ej: caja de 6 piezas, rollo de 3 metros, pack doble..."
            value={form.pkgNote}
            onChange={(e) => update('pkgNote', e.target.value)}
            className={input}
          />
          <span className="text-[11px] text-slate-400">
            Opcional. Para recordarte qué contiene la caja (solo lo ves tú).
          </span>
        </label>

        {/* Indicadores de peso volumétrico en vivo */}
        {(form.pkgWeight || (form.pkgLength && form.pkgWidth && form.pkgHeight)) && (
          <div className="mt-4 flex flex-wrap gap-4 text-xs">
            {form.pkgWeight && (
              <div className="bg-white border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-slate-500">Peso real:</span>{' '}
                <strong className="text-slate-800">{parseFloat(form.pkgWeight).toFixed(3)} kg</strong>
              </div>
            )}
            {form.pkgLength && form.pkgWidth && form.pkgHeight && (() => {
              const volKg = (parseFloat(form.pkgLength) * parseFloat(form.pkgWidth) * parseFloat(form.pkgHeight)) / 5000
              const real = parseFloat(form.pkgWeight) || 0
              const cobrable = Math.max(real, volKg)
              return (
                <>
                  <div className="bg-white border border-blue-200 rounded-lg px-3 py-2">
                    <span className="text-slate-500">Peso volumétrico:</span>{' '}
                    <strong className="text-slate-800">{volKg.toFixed(3)} kg</strong>
                    <span className="text-slate-400 ml-1">(L×A×H ÷ 5 000)</span>
                  </div>
                  {form.pkgWeight && (
                    <div className={`border rounded-lg px-3 py-2 ${cobrable > real ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-green-50 border-green-300 text-green-800'}`}>
                      <span>Peso cobrable por carrier:</span>{' '}
                      <strong>{cobrable.toFixed(3)} kg</strong>
                      {cobrable > real && <span className="ml-1 font-normal">(se cobra el volumétrico)</span>}
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}
      </fieldset>


  </>)
}
