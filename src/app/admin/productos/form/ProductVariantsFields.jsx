'use client'
import { COMMON_COLORS, COMMON_SIZES } from './constants'
export default function ProductVariantsFields({ form, input, addVariant, removeVariant, updateVariant, addVariantGalleryImages, removeVariantGalleryImage, uploadVariantImage }) {
  return (<>
      {/* ── Variantes ──────────────────────────────────────────────────────── */}
      <fieldset className="border border-slate-200 rounded-xl p-4 space-y-4">
        <legend className="px-2 text-sm font-bold text-slate-700">Variantes</legend>
        <div className="text-xs text-slate-600 -mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
          <p>
            <b>Regla:</b> si este producto se vende en varios colores o tamaños,
            <b> cada opción debe ser una variante</b> — incluyendo la del color principal.
          </p>
          <p className="text-slate-500">
            Ejemplo: una hielera que viene en azul y rojo lleva <b>dos</b> variantes
            (Color: Azul y Color: Rojo). El campo "Color" de arriba se deja vacío.
          </p>
          <p className="text-slate-500">
            Si ya llenaste el campo "Color" de arriba, al darle <b>+ Añadir variante</b> ese color
            se convierte solo en la primera variante, con las fotos del producto.
          </p>
          <p className="text-slate-500">
            Precio y medidas de caja son los del producto. Si un color cuesta distinto, no es
            variante: es otro producto (enlázalo con "Línea").
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={addVariant}
            className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-sm font-semibold"
          >
            + Añadir variante
          </button>
          {form.variants.length > 0 && (
            <span className="text-xs text-slate-500">
              {form.variants.length} variante{form.variants.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {form.variants.length === 0 && (
          <p className="text-xs text-slate-400 italic">
            Sin variantes. El producto se vende como una sola opción, usando el
            precio, SKU y medidas de arriba.
          </p>
        )}

        {form.variants.length > 0 && (
          <div className="space-y-4">
            {form.variants.map((v, i) => {
              const vLabel = v.label || 'Color'
              const vImgs = Array.isArray(v.images) && v.images.length > 0 ? v.images : v.image ? [v.image] : []
              const vStockMode = v.stock === null || v.stock === undefined || v.stock === '' ? 'disponible' : Number(v.stock) === 0 ? 'agotado' : 'cantidad'
              return (
                <div key={i} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">

                  {/* ── Cabecera: tipo + valor + eliminar ── */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
                    {/* Miniatura */}
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 grid place-items-center">
                      {v.image
                        ? <img src={v.image} alt="" className="w-full h-full object-cover" />
                        : <span className="text-slate-300 text-[10px] text-center leading-tight">sin foto</span>
                      }
                    </div>

                    {/* Tipo */}
                    <div className="flex gap-1 shrink-0">
                      {['Color', 'Tamaño'].map((tipo) => (
                        <button key={tipo} type="button" onClick={() => updateVariant(i, 'label', tipo)}
                          className={`px-3 py-1 rounded-lg border text-xs font-semibold transition ${
                            vLabel === tipo ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                          }`}>
                          {tipo === 'Color' ? '🎨 Color' : '📐 Tamaño'}
                        </button>
                      ))}
                    </div>

                    {/* Valor */}
                    <input
                      value={v.value}
                      onChange={(e) => updateVariant(i, 'value', e.target.value)}
                      placeholder={vLabel === 'Color' ? 'Ej: Rojo, Azul marino…' : vLabel === 'Tamaño' ? 'Ej: S, M, L, XL…' : 'Valor'}
                      maxLength={60}
                      className="flex-1 px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:border-brand-500 bg-white min-w-0"
                    />

                    {/* Tipo personalizado (si no es Color ni Tamaño) */}
                    {!['Color', 'Tamaño'].includes(vLabel) && (
                      <input
                        value={vLabel}
                        onChange={(e) => updateVariant(i, 'label', e.target.value || 'Color')}
                        placeholder="Otro tipo…"
                        maxLength={30}
                        className="w-28 px-2 py-1.5 text-xs border border-brand-300 rounded-lg focus:outline-none focus:border-brand-500 bg-brand-50 text-brand-800"
                      />
                    )}
                    {['Color', 'Tamaño'].includes(vLabel) && (
                      <input
                        value=""
                        onChange={(e) => { if (e.target.value) updateVariant(i, 'label', e.target.value) }}
                        placeholder="Otro tipo…"
                        maxLength={30}
                        className="w-24 px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 text-slate-500 bg-white"
                      />
                    )}

                    {/* Eliminar */}
                    <button type="button" onClick={() => removeVariant(i)}
                      className="w-8 h-8 shrink-0 grid place-items-center rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 font-bold text-lg transition ml-auto"
                      title="Eliminar variante">×</button>
                  </div>

                  <div className="px-4 py-3 space-y-4">
                    {/* ── Chips rápidos ── */}
                    {vLabel === 'Color' && (
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_COLORS.map((c) => (
                          <button key={c} type="button" onClick={() => updateVariant(i, 'value', c)}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition ${
                              v.value === c ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                            }`}>{c}</button>
                        ))}
                      </div>
                    )}
                    {vLabel === 'Tamaño' && (
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_SIZES.map((s) => (
                          <button key={s} type="button" onClick={() => updateVariant(i, 'value', s)}
                            className={`px-3 py-0.5 rounded-lg text-xs font-semibold border transition ${
                              v.value === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
                            }`}>{s}</button>
                        ))}
                      </div>
                    )}

                    {/* ── Disponibilidad ── */}
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block mb-2">Disponibilidad</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { val: 'disponible', icon: '✅', text: 'Disponible' },
                          { val: 'agotado',    icon: '❌', text: 'Sin stock'  },
                          { val: 'cantidad',   icon: '🔢', text: 'Cantidad'   },
                        ].map(({ val, icon, text }) => (
                          <label key={val}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer text-sm transition ${
                              vStockMode === val
                                ? 'border-brand-500 bg-brand-50 text-brand-800 font-semibold'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                            }`}>
                            <input type="radio" name={`stockMode-${i}`} checked={vStockMode === val}
                              onChange={() => {
                                if (val === 'disponible') updateVariant(i, 'stock', null)
                                else if (val === 'agotado') updateVariant(i, 'stock', 0)
                                else updateVariant(i, 'stock', v.stock > 0 ? v.stock : 1)
                              }}
                              className="w-3.5 h-3.5 accent-brand-600"
                            />
                            {icon} {text}
                          </label>
                        ))}
                        {vStockMode === 'cantidad' && (
                          <input type="number" min={1}
                            value={v.stock ?? 1}
                            onChange={(e) => updateVariant(i, 'stock', e.target.value)}
                            placeholder="Ej: 10"
                            className="w-24 px-3 py-1.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-brand-500"
                          />
                        )}
                      </div>
                    </div>

                    {/* ── SKU de la variante ── */}
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 block mb-1">
                        SKU de este color <span className="font-normal text-slate-400">(opcional; si se deja vacío usa el del producto)</span>
                      </span>
                      <input
                        value={v.sku || ''}
                        onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                        placeholder={form.sku || 'Ej: HIE48-AZ'}
                        className="w-full sm:w-64 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 bg-white font-mono placeholder:text-slate-300"
                      />
                    </label>

                    {/* ── Código de barras ── */}
                    <label className="block">
                      <span className="text-xs font-semibold text-slate-600 block mb-1">
                        Código de barras <span className="font-normal text-slate-400">(EAN/UPC, opcional)</span>
                      </span>
                      <input
                        value={v.barcode || ''}
                        onChange={(e) => updateVariant(i, 'barcode', e.target.value)}
                        placeholder="7501234567890"
                        className="w-full sm:w-64 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-brand-400 bg-white font-mono placeholder:text-slate-300"
                      />
                    </label>

                    {/* ── Fotos de esta variante ── */}
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block mb-2">
                        Fotos de esta variante{' '}
                        <span className="text-slate-400 font-normal">({vImgs.length}/10)</span>
                      </span>
                      {vImgs.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {vImgs.map((url, pi) => (
                            <div key={url} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                              <img src={url} alt="" className="w-full h-full object-cover" />
                              {pi === 0 && (
                                <span className="absolute bottom-0 inset-x-0 text-center text-[8px] bg-brand-600/80 text-white font-bold py-0.5">
                                  principal
                                </span>
                              )}
                              <button type="button"
                                onClick={() => removeVariantGalleryImage(i, url)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white text-xs grid place-items-center opacity-0 group-hover:opacity-100 transition"
                                title="Quitar">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-xs text-slate-600 cursor-pointer hover:bg-slate-50 transition">
                        <span>+ Añadir fotos</span>
                        <input type="file" accept="image/*" multiple className="hidden"
                          onChange={(e) => addVariantGalleryImages(i, e.target.files)} />
                      </label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </fieldset>


  </>)
}
