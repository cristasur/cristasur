'use client'
// ============================================================
// Filtros del catálogo (/productos y /categoria/[slug]).
// Estilo MAHA: cada grupo es una sección colapsable con +/−,
// renglones tipo casilla con el conteo en gris a la derecha
// (solo cuando el dato existe), "Mostrar más" después de 6 opciones,
// precio con dos campos y atajos, y colores con muestra cuadrada.
//
// Desktop (lg+): columna fija a la izquierda; cabecera con
//                "Limpiar filtros" y botón "Aplicar" siempre visibles.
// Móvil (<lg):   botón "Filtrar" que abre un panel a pantalla completa
//                con los mismos grupos y un botón "Aplicar".
//
// La lógica NO cambia: el estado vive en `form` / `specs` y se
// manda al URL con router.push al aplicar (mismos parámetros:
// q, category, minPrice, maxPrice, inStock, onSale, featured, sort,
// brand, color, material y `spec` repetido).
// ============================================================
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Icon from './Icon'

// ── Nombres de color (español) → hex para la muestra ─────────
const COLOR_HEX = {
  'rojo': '#e53e3e',
  'rojo oscuro': '#9b2335',
  'vino': '#7b1e3a',
  'azul': '#3182ce',
  'azul marino': '#1a365d',
  'marino': '#1a365d',
  'azul claro': '#63b3ed',
  'azul rey': '#2244cc',
  'celeste': '#63b3ed',
  'verde': '#38a169',
  'verde claro': '#9ae6b4',
  'verde oscuro': '#276749',
  'verde militar': '#4a5e2a',
  'verde limón': '#a3e635',
  'verde limon': '#a3e635',
  'amarillo': '#ecc94b',
  'naranja': '#ed8936',
  'rosa': '#f687b3',
  'rosa pastel': '#fbcfe8',
  'fucsia': '#d53f8c',
  'morado': '#805ad5',
  'lila': '#b794f4',
  'negro': '#1a202c',
  'blanco': '#ffffff',
  'hueso': '#f5f1e6',
  'marfil': '#fffff0',
  'crema': '#f8f1dc',
  'gris': '#718096',
  'gris claro': '#cbd5e0',
  'gris oscuro': '#4a5568',
  'cafe': '#8b4513',
  'café': '#8b4513',
  'café oscuro': '#5c3317',
  'chocolate': '#5c3317',
  'beige': '#e8dcc4',
  'arena': '#d6c6a5',
  'dorado': '#d4af37',
  'oro': '#d4af37',
  'plateado': '#c0c0c0',
  'plata': '#c0c0c0',
  'cobre': '#b87333',
  'turquesa': '#38b2ac',
  'aqua': '#5fd4d0',
  'coral': '#ff6b6b',
  'salmón': '#fa8072',
  'salmon': '#fa8072',
  'menta': '#a8e6cf',
  'lavanda': '#e6e6fa',
  'natural': '#e9dcc3',
  'madera': '#a0703c',
  'transparente': 'transparent',
  'cristal': 'transparent',
}

// Colores que se ofrecen como atajo en el grupo "Color". No traen
// conteo porque el servidor no lo calcula; el filtro es el mismo de
// siempre (?color=Nombre, coincidencia parcial sin mayúsculas).
const COMMON_COLORS = [
  'Blanco', 'Negro', 'Transparente', 'Rojo', 'Azul', 'Verde',
  'Amarillo', 'Naranja', 'Rosa', 'Morado', 'Gris', 'Café',
  'Beige', 'Turquesa', 'Dorado', 'Plateado',
]

const PRICE_PRESETS = [
  { label: 'Hasta $50', min: '', max: '50' },
  { label: '$50 – $150', min: '50', max: '150' },
  { label: '$150 – $500', min: '150', max: '500' },
  { label: 'Más de $500', min: '500', max: '' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'priceAsc', label: 'Precio: menor a mayor' },
  { value: 'priceDesc', label: 'Precio: mayor a menor' },
  { value: 'popular', label: 'Más populares' },
]

const SHOW_LIMIT = 6

function colorHex(name) {
  const k = String(name || '').toLowerCase().trim()
  if (!k) return null
  if (COLOR_HEX[k] !== undefined) return COLOR_HEX[k]
  // "Azul cielo" → toma la primera palabra conocida
  const first = k.split(/\s+/)[0]
  if (COLOR_HEX[first] !== undefined) return COLOR_HEX[first]
  return null
}

const norm = (s) => String(s || '').toLowerCase().trim()

// ── Piezas visuales ──────────────────────────────────────────

// Muestra cuadrada de color (gris neutro si no lo conocemos)
function Swatch({ name }) {
  const hex = colorHex(name)
  if (hex === 'transparent') {
    return (
      <span
        className="w-4 h-4 rounded-[4px] border border-slate-300 shrink-0"
        style={{
          backgroundImage:
            'linear-gradient(45deg,#e2e8f0 25%,transparent 25%,transparent 75%,#e2e8f0 75%),linear-gradient(45deg,#e2e8f0 25%,#fff 25%,#fff 75%,#e2e8f0 75%)',
          backgroundSize: '6px 6px',
          backgroundPosition: '0 0,3px 3px',
        }}
        aria-hidden="true"
      />
    )
  }
  return (
    <span
      className="w-4 h-4 rounded-[4px] border border-slate-300 shrink-0"
      style={{ backgroundColor: hex || '#cbd5e1' }}
      aria-hidden="true"
    />
  )
}

// Renglón tipo casilla: [■] Nombre ........ 12
function OptionRow({ checked, onToggle, label, count, swatch = false, radio = false }) {
  return (
    <button
      type="button"
      role={radio ? 'radio' : 'checkbox'}
      aria-checked={checked}
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 py-1.5 text-left group"
    >
      <span
        className={`w-[18px] h-[18px] shrink-0 grid place-items-center border transition-colors ${
          radio ? 'rounded-full' : 'rounded-[4px]'
        } ${checked ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-300 group-hover:border-slate-500'}`}
        aria-hidden="true"
      >
        {checked && (radio
          ? <span className="w-1.5 h-1.5 rounded-full bg-white" />
          : <Icon name="check" className="w-3 h-3" strokeWidth={3} />)}
      </span>
      {swatch && <Swatch name={label} />}
      <span className={`flex-1 min-w-0 truncate text-[13.5px] ${checked ? 'text-slate-900 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>
        {label}
      </span>
      {count !== undefined && count !== null && (
        <span className="text-xs text-slate-400 tabular-nums shrink-0">{count}</span>
      )}
    </button>
  )
}

// Lista con "Mostrar más / menos" a partir de SHOW_LIMIT opciones.
// `options`: [{ key, label, count?, checked }]
function OptionList({ options, onToggle, swatch = false, radio = false }) {
  const selectedBeyond = options.findIndex((o) => o.checked) >= SHOW_LIMIT
  const [expanded, setExpanded] = useState(selectedBeyond)
  const visible = expanded ? options : options.slice(0, SHOW_LIMIT)
  const hidden = options.length - SHOW_LIMIT
  return (
    <div>
      <div className={expanded && options.length > 14 ? 'max-h-72 overflow-y-auto pr-1 -mr-1' : ''}>
        {visible.map((o) => (
          <OptionRow
            key={o.key}
            checked={o.checked}
            onToggle={() => onToggle(o)}
            label={o.label}
            count={o.count}
            swatch={swatch}
            radio={radio}
          />
        ))}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-[13px] font-semibold text-brand-700 hover:text-brand-900 hover:underline"
        >
          {expanded ? 'Mostrar menos' : `Mostrar más (${hidden})`}
        </button>
      )}
    </div>
  )
}

// Sección colapsable con título y +/−
function Section({ id, title, badge = 0, open, onToggle, children }) {
  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 py-3.5 text-left"
      >
        <span className="text-[13px] font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
          {title}
          {badge > 0 && (
            <span className="text-[10px] bg-brand-600 text-white rounded-full min-w-[18px] h-[18px] px-1 grid place-items-center font-bold leading-none normal-case">
              {badge}
            </span>
          )}
        </span>
        <span className="w-5 h-5 grid place-items-center text-slate-500 text-lg leading-none select-none shrink-0" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && <div className="pb-4 -mt-1">{children}</div>}
    </div>
  )
}

export default function ProductFilters({
  // Facetas dinámicas sacadas de la ficha técnica de los productos.
  // facets: [{ label, values: [{ value, count }] }]
  facets = [],
  selectedSpecs = {},
  categories = [],
  brands = [],
  materials = [],
  initialFilters = {},
  hideCategory = false, // si true, oculta el grupo de categoría (caso /categoria/[slug])
  basePath = '/productos', // a dónde se envía el form al aplicar/limpiar
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const [form, setForm] = useState({
    q:        sp.get('q')        ?? initialFilters.q        ?? '',
    category: sp.get('category') ?? initialFilters.category ?? '',
    minPrice: sp.get('minPrice') ?? initialFilters.minPrice ?? '',
    maxPrice: sp.get('maxPrice') ?? initialFilters.maxPrice ?? '',
    inStock:  (sp.get('inStock')  ?? (initialFilters.inStock  ? '1' : '')) === '1',
    onSale:   (sp.get('onSale')   ?? (initialFilters.onSale   ? '1' : '')) === '1',
    featured: (sp.get('featured') ?? (initialFilters.featured ? '1' : '')) === '1',
    sort:     sp.get('sort')     ?? initialFilters.sort     ?? 'newest',
    brand:    sp.get('brand')    ?? initialFilters.brand    ?? '',
    color:    sp.get('color')    ?? initialFilters.color    ?? '',
    material: sp.get('material') ?? initialFilters.material ?? '',
  })

  // Facetas marcadas: { 'Acabado': ['Mate'], 'Forma': ['Redondo'] }
  const [specs, setSpecs] = useState(() => {
    const out = {}
    for (const [k, v] of Object.entries(selectedSpecs || {})) out[k] = [...v]
    return out
  })

  // Secciones abiertas. Arrancan abiertas las principales, las dos
  // primeras facetas y cualquier grupo que ya tenga algo marcado.
  const [openSections, setOpenSections] = useState(() => {
    const s = new Set(['q', 'category', 'brand', 'price', 'color', 'availability'])
    if (form.material) s.add('material')
    if (form.sort && form.sort !== 'newest') s.add('sort')
    facets.slice(0, 2).forEach((f) => s.add(`spec:${f.label}`))
    Object.keys(selectedSpecs || {}).forEach((l) => s.add(`spec:${l}`))
    return s
  })

  const specCount = Object.values(specs).reduce((n, v) => n + v.length, 0)

  function toggleSpec(label, value) {
    setSpecs((prev) => {
      const cur = prev[label] || []
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value]
      const out = { ...prev }
      if (next.length) out[label] = next
      else delete out[label]
      return out
    })
  }

  function toggleSection(id) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Cuenta filtros activos para el badge
  const activeCount = [
    form.q, form.category, form.brand, form.color, form.material,
    form.minPrice, form.maxPrice,
    form.inStock ? '1' : '', form.onSale ? '1' : '', form.featured ? '1' : '',
    form.sort !== 'newest' ? '1' : '',
  ].filter(Boolean).length + specCount

  // En móvil: siempre cerrado al entrar, el usuario lo abre manualmente
  const [mobileOpen, setMobileOpen] = useState(false)

  // Bloquear el scroll de la página mientras el panel móvil está abierto
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  // Selección única (categoría / marca / material / color): volver a
  // tocar la opción marcada la desmarca.
  function toggleSingle(k, v) {
    setForm((f) => ({ ...f, [k]: f[k] === v ? '' : v }))
  }

  function apply(e) {
    e?.preventDefault?.()
    const params = new URLSearchParams()
    if (form.q)        params.set('q',        form.q)
    // Si estamos en una landing de categoría (hideCategory), no metemos
    // el parámetro `category` — la página ya filtra por el slug del URL.
    if (form.category && !hideCategory) params.set('category', form.category)
    if (form.minPrice) params.set('minPrice', form.minPrice)
    if (form.maxPrice) params.set('maxPrice', form.maxPrice)
    if (form.inStock)  params.set('inStock',  '1')
    if (form.onSale)   params.set('onSale',   '1')
    if (form.featured) params.set('featured', '1')
    if (form.sort && form.sort !== 'newest') params.set('sort', form.sort)
    if (form.brand)    params.set('brand',    form.brand)
    if (form.color)    params.set('color',    form.color)
    if (form.material) params.set('material', form.material)
    // Un parámetro `spec` por casilla marcada: Acabado~Mate, Forma~Redondo…
    for (const [label, values] of Object.entries(specs)) {
      for (const v of values) params.append('spec', `${label}~${v}`)
    }
    const qs = params.toString()
    setMobileOpen(false)
    router.push(basePath + (qs ? `?${qs}` : ''))
  }

  function reset() {
    setForm({ q:'', category:'', minPrice:'', maxPrice:'', inStock:false, onSale:false, featured:false, sort:'newest', brand:'', color:'', material:'' })
    setSpecs({})
    setMobileOpen(false)
    router.push(basePath)
  }

  // ¿El color escrito coincide con alguno de la lista de atajos?
  const colorInList = COMMON_COLORS.some((c) => norm(c) === norm(form.color))
  const priceActive = Boolean(form.minPrice || form.maxPrice)

  return (
    <form onSubmit={apply} className="w-full">
      {/* ── Botón "Filtrar" (solo móvil) ── */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 shadow-sm active:bg-slate-50"
        >
          <Icon name="filter" className="w-4 h-4" />
          Filtrar
          {activeCount > 0 && (
            <span className="text-[11px] bg-brand-600 text-white rounded-full px-2 py-0.5 font-bold leading-none">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="h-11 px-3 text-xs font-semibold text-slate-500 hover:text-slate-900 underline"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── Panel: cajón a pantalla completa en móvil / columna en desktop ── */}
      <div
        className={`${mobileOpen ? 'fixed inset-0 z-[90] flex' : 'hidden'} lg:static lg:z-auto lg:flex`}
        role={mobileOpen ? 'dialog' : undefined}
        aria-modal={mobileOpen ? 'true' : undefined}
        aria-label="Filtros"
      >
        {/* Fondo oscuro (móvil) */}
        <div
          className="absolute inset-0 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        <div className="relative ml-auto w-full max-w-md h-full bg-white flex flex-col shadow-2xl lg:shadow-none lg:ml-0 lg:max-w-none lg:h-auto lg:max-h-[calc(100vh-7rem)] lg:rounded-2xl lg:border lg:border-slate-200">
          {/* Cabecera fija: título + Limpiar filtros */}
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 lg:px-5 h-14 border-b border-slate-200">
            <span className="font-black text-slate-900 flex items-center gap-2 text-[15px]">
              Filtrar por
              {activeCount > 0 && (
                <span className="text-[11px] bg-brand-600 text-white rounded-full px-2 py-0.5 font-bold leading-none">
                  {activeCount}
                </span>
              )}
            </span>
            <div className="flex items-center gap-3">
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-2"
                >
                  Limpiar filtros
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar filtros"
                className="lg:hidden w-9 h-9 -mr-2 grid place-items-center rounded-full text-slate-600 hover:bg-slate-100"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Cuerpo con scroll propio */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 lg:px-5">

            {/* Buscar */}
            <Section id="q" title="Buscar" badge={form.q ? 1 : 0} open={openSections.has('q')} onToggle={toggleSection}>
              <div className="relative">
                <Icon name="search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={form.q}
                  onChange={(e) => set('q', e.target.value)}
                  placeholder="Palabra clave, marca…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </Section>

            {/* Categoría */}
            {!hideCategory && categories.length > 0 && (
              <Section id="category" title="Categoría" badge={form.category ? 1 : 0} open={openSections.has('category')} onToggle={toggleSection}>
                <OptionList
                  radio
                  options={categories.map((c) => {
                    const v = c.slug || c._id
                    return { key: String(c._id), value: v, label: c.name, checked: form.category === v }
                  })}
                  onToggle={(o) => toggleSingle('category', o.value)}
                />
              </Section>
            )}

            {/* Marca */}
            {brands.length > 0 && (
              <Section id="brand" title="Marca" badge={form.brand ? 1 : 0} open={openSections.has('brand')} onToggle={toggleSection}>
                <OptionList
                  radio
                  options={brands.map((b) => ({ key: String(b._id), value: b.slug, label: b.name, checked: form.brand === b.slug }))}
                  onToggle={(o) => toggleSingle('brand', o.value)}
                />
              </Section>
            )}

            {/* Material */}
            {materials.length > 0 && (
              <Section id="material" title="Material" badge={form.material ? 1 : 0} open={openSections.has('material')} onToggle={toggleSection}>
                <OptionList
                  radio
                  options={materials.map((m) => ({ key: String(m._id), value: m.slug, label: m.name, checked: form.material === m.slug }))}
                  onToggle={(o) => toggleSingle('material', o.value)}
                />
              </Section>
            )}

            {/* Precio */}
            <Section id="price" title="Precio" badge={priceActive ? 1 : 0} open={openSections.has('price')} onToggle={toggleSection}>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                  <input
                    type="number" min={0} placeholder="Mín" inputMode="numeric"
                    aria-label="Precio mínimo"
                    value={form.minPrice}
                    onChange={(e) => set('minPrice', e.target.value)}
                    className="w-full pl-6 pr-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <span className="text-slate-400 text-sm">–</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
                  <input
                    type="number" min={0} placeholder="Máx" inputMode="numeric"
                    aria-label="Precio máximo"
                    value={form.maxPrice}
                    onChange={(e) => set('maxPrice', e.target.value)}
                    className="w-full pl-6 pr-2 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
              {/* Atajos de rango: solo llenan los dos campos */}
              <div className="mt-3 space-y-0.5">
                {PRICE_PRESETS.map((p) => (
                  <OptionRow
                    key={p.label}
                    radio
                    label={p.label}
                    checked={String(form.minPrice) === p.min && String(form.maxPrice) === p.max}
                    onToggle={() => {
                      const isOn = String(form.minPrice) === p.min && String(form.maxPrice) === p.max
                      setForm((f) => ({ ...f, minPrice: isOn ? '' : p.min, maxPrice: isOn ? '' : p.max }))
                    }}
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Precios en MXN</p>
            </Section>

            {/* Color */}
            <Section id="color" title="Color" badge={form.color ? 1 : 0} open={openSections.has('color')} onToggle={toggleSection}>
              <OptionList
                swatch
                options={[
                  // Si el color activo no está en la lista, lo mostramos primero
                  ...(form.color && !colorInList
                    ? [{ key: `x-${form.color}`, value: form.color, label: form.color, checked: true }]
                    : []),
                  ...COMMON_COLORS.map((c) => ({ key: c, value: c, label: c, checked: norm(form.color) === norm(c) })),
                ]}
                onToggle={(o) => setForm((f) => ({ ...f, color: norm(f.color) === norm(o.value) ? '' : o.value }))}
              />
              <input
                value={colorInList ? '' : form.color}
                onChange={(e) => set('color', e.target.value)}
                placeholder="Otro color (ej. Azul marino)"
                aria-label="Otro color"
                className="mt-2.5 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </Section>

            {/* Facetas dinámicas de la ficha técnica (Acabado, Medida, Forma…)
                Si el admin captura "Acabado: Mate", aquí aparece sola, con su conteo. */}
            {facets.map((f) => {
              const id = `spec:${f.label}`
              const picked = specs[f.label] || []
              const isColor = /^colou?r(es)?$/i.test(String(f.label).trim())
              return (
                <Section key={id} id={id} title={f.label} badge={picked.length} open={openSections.has(id)} onToggle={toggleSection}>
                  <OptionList
                    swatch={isColor}
                    options={f.values.map((v) => ({
                      key: String(v.value), value: v.value, label: v.value, count: v.count, checked: picked.includes(v.value),
                    }))}
                    onToggle={(o) => toggleSpec(f.label, o.value)}
                  />
                </Section>
              )
            })}

            {/* Disponibilidad, ofertas y destacados */}
            <Section
              id="availability"
              title="Disponibilidad"
              badge={[form.inStock, form.onSale, form.featured].filter(Boolean).length}
              open={openSections.has('availability')}
              onToggle={toggleSection}
            >
              <OptionRow label="Solo con stock disponible" checked={form.inStock} onToggle={() => set('inStock', !form.inStock)} />
              <OptionRow label="En oferta" checked={form.onSale} onToggle={() => set('onSale', !form.onSale)} />
              <OptionRow label="Destacados" checked={form.featured} onToggle={() => set('featured', !form.featured)} />
            </Section>

            {/* Ordenar */}
            <Section id="sort" title="Ordenar por" badge={form.sort !== 'newest' ? 1 : 0} open={openSections.has('sort')} onToggle={toggleSection}>
              {SORT_OPTIONS.map((o) => (
                <OptionRow key={o.value} radio label={o.label} checked={form.sort === o.value} onToggle={() => set('sort', o.value)} />
              ))}
            </Section>
          </div>

          {/* Pie fijo: Aplicar */}
          <div className="shrink-0 p-4 lg:px-5 border-t border-slate-200 bg-white lg:rounded-b-2xl pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-brand-700 text-white font-bold text-sm transition-colors"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
