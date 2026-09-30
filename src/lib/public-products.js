// Campos que cualquier visitante puede ver de un producto. Todo lo demás
// (historial de edición con correos, notas de empaque, contadores
// internos, quién lo creó) se queda solo para el panel.
export const PUBLIC_PRODUCT_FIELDS = [
  'name', 'slug', 'description', 'price', 'comparePrice',
  'wholesalePrice', 'wholesaleMinQty', 'hundredPrice', 'hundredMinQty',
  'categories', 'image', 'gallery', 'videoUrl', 'featured', 'stock', 'sku', 'qtyStep',
  'capacity', 'capacityUnit', 'weight', 'length', 'width', 'height',
  'brand', 'materials', 'resistencia', 'line', 'lineLabel', 'lineColor',
  'specs', 'highlights', 'usage', 'color', 'tags', 'avgRating', 'reviewCount',
  'createdAt',
  'variants.label', 'variants.value', 'variants.sku', 'variants.available', 'variants.stock',
  'variants.image', 'variants.images', 'variants._id',
].join(' ')

export function publicProductFilter(now = new Date()) {
  return {
    active: true, deleted: { $ne: true },
    $and: [
      { $or: [{ status: { $exists: false } }, { status: 'published' }] },
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
    ],
  }
}
