'use client'
const MAX_GALLERY = 10
export default function ProductMediaFields({ form, input, uploading, uploadingGallery, onFileChange, onGalleryFilesChange, update, galleryUrlInput, setGalleryUrlInput, addingGalleryUrl, addGalleryByUrl, makeMain, moveGalleryItem, removeGalleryItem }) {
  return (<>
      {/* Imagen principal */}
      <div>
        <span className="text-sm font-medium text-slate-700">Imagen principal</span>

        {/* Tip de medidas ideales — aplica también a la galería */}
        <div className="mt-2 mb-3 rounded-lg bg-sky-50 border border-sky-200 p-3 text-xs text-sky-900">
          <p className="font-bold mb-1">💡 Medida recomendada para fotos de producto</p>
          <ul className="list-disc pl-5 space-y-0.5 leading-relaxed">
            <li>
              <b>1200 × 1200 px (cuadrada 1:1)</b> es lo ideal — se ve nítida en cualquier pantalla.
            </li>
            <li>
              Mínimo aceptable: 800 × 800 px. Máximo: 1600 × 1600 px
              (se redimensiona automáticamente, no más grande).
            </li>
            <li>
              Formato JPG, PNG o WebP. Peso máximo 8 MB (el server las comprime a WebP
              ~150-300 KB).
            </li>
            <li>
              Fondo blanco o neutro, producto centrado y con buena luz.
              Sin marcas de agua ni texto pegado.
            </li>
          </ul>
        </div>

        <div className="mt-2 flex items-center gap-4">
          <div className="w-32 h-32 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 grid place-items-center shrink-0">
            {form.image ? (
              <img
                src={form.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl text-slate-300">📦</span>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-sm font-semibold cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {form.image ? 'Añadir más fotos' : 'Seleccionar fotos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>
              <span className="text-xs text-slate-400">Puedes seleccionar varias a la vez</span>
            </div>
            <div className="text-xs text-slate-500">
              O pega una URL externa o ruta local (/uploads/...):
            </div>
            <input
              type="text"
              inputMode="url"
              placeholder="https://... o /uploads/..."
              value={form.image}
              onChange={(e) => update('image', e.target.value)}
              className={input}
            />
            {uploading && (
              <div className="text-xs text-slate-500">Subiendo imagen…</div>
            )}
          </div>
        </div>
      </div>

      {/* Video del producto */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Video del producto{' '}
          <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <p className="text-xs text-slate-500 mb-2">
          Pega un link de YouTube, TikTok o un enlace directo a un archivo .mp4.
          El video aparecerá como primer elemento en la galería.
        </p>
        <input
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=... o https://www.tiktok.com/@..."
          value={form.videoUrl}
          onChange={(e) => update('videoUrl', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
        />
        {form.videoUrl && (
          <button
            type="button"
            onClick={() => update('videoUrl', '')}
            className="mt-1 text-xs text-red-500 hover:text-red-700"
          >
            Quitar video
          </button>
        )}
      </div>

      {/* Galería de imágenes adicionales */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            Galería de imágenes{' '}
            <span className="text-slate-400 font-normal">
              ({form.gallery.length}/{MAX_GALLERY})
            </span>
          </span>
          {uploadingGallery && (
            <span className="text-xs text-slate-500">Subiendo…</span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Imágenes adicionales que se muestran en el detalle del producto. Puedes
          seleccionar varios archivos a la vez.{' '}
          <span className="text-sky-700 font-semibold">
            Misma medida ideal: 1200 × 1200 px cuadradas, fondo blanco.
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-300 text-sm text-slate-700 cursor-pointer hover:bg-slate-50">
            <span>+ Añadir imágenes</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onGalleryFilesChange}
              className="hidden"
              disabled={form.gallery.length >= MAX_GALLERY}
            />
          </label>

          {/* Añadir imagen de galería por URL */}
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <input
              type="text"
              inputMode="url"
              placeholder="https://... pega un link de imagen"
              value={galleryUrlInput}
              onChange={(e) => setGalleryUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryByUrl())}
              disabled={form.gallery.length >= MAX_GALLERY || addingGalleryUrl}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={addGalleryByUrl}
              disabled={!galleryUrlInput.trim() || form.gallery.length >= MAX_GALLERY || addingGalleryUrl}
              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-sm font-semibold disabled:opacity-40"
            >
              {addingGalleryUrl ? 'Añadiendo…' : 'Añadir URL'}
            </button>
          </div>
        </div>

        {form.gallery.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {form.gallery.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square"
              >
                <img
                  src={url}
                  alt={`Galería ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-x-1 bottom-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, -1)}
                      disabled={i === 0}
                      className="w-7 h-7 grid place-items-center rounded-md bg-white/90 text-slate-700 hover:bg-white shadow disabled:opacity-40"
                      title="Mover a la izquierda"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveGalleryItem(i, 1)}
                      disabled={i === form.gallery.length - 1}
                      className="w-7 h-7 grid place-items-center rounded-md bg-white/90 text-slate-700 hover:bg-white shadow disabled:opacity-40"
                      title="Mover a la derecha"
                    >
                      →
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => makeMain(i)}
                      className="px-2 h-7 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-semibold shadow"
                      title="Usar como principal"
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="w-7 h-7 grid place-items-center rounded-md bg-rose-500 hover:bg-rose-600 text-white shadow"
                      title="Eliminar"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


  </>)
}
