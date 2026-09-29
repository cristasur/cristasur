function variantesLimpias(initial) {
  return (Array.isArray(initial?.variants) ? initial.variants : []).map((v) => ({
    label: v.label || 'Color',
    value: v.value || '',
    sku: v.sku || '',
    barcode: v.barcode || '',
    available: v.available !== false,
    stock: v.stock ?? null,
    image: v.image || '',
    images: Array.isArray(v.images) && v.images.length ? v.images : v.image ? [v.image] : [],
  }))
}
function colorBaseLegado(initial) {
  const c = (initial?.color || '').trim()
  const vs = variantesLimpias(initial)
  if (!c || !vs.some((v) => /color/i.test(v.label))) return ''
  return vs.some((v) => v.value.trim().toLowerCase() === c.toLowerCase()) ? '' : c
}
export function variantesIniciales(initial) {
  const vs = variantesLimpias(initial)
  const base = colorBaseLegado(initial)
  if (!base) return vs
  const fotos = [initial?.image, ...(initial?.gallery || [])].filter(Boolean).slice(0, 10)
  return [{ label: 'Color', value: base, sku: initial?.sku || '', barcode: '', available: true,
    stock: null, image: fotos[0] || '', images: fotos }, ...vs]
}
export function colorInicial(initial) {
  const vs = variantesLimpias(initial)
  return vs.some((v) => /color/i.test(v.label)) ? '' : (initial?.color || '')
}

