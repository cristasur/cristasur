// ============================================================
// Arma el árbol de categorías a partir de la lista plana de la BD.
// Solo dos niveles: principales y sus hijas directas.
//
// Lo usan CategoryBar y CategoriesDropdown para no duplicar lógica.
// ============================================================
export function buildCategoryTree(categories) {
  const list = Array.isArray(categories) ? categories : []
  const roots = list.filter((c) => !c.parent)

  const byParent = new Map()
  for (const c of list) {
    if (!c.parent) continue
    const k = String(c.parent)
    if (!byParent.has(k)) byParent.set(k, [])
    byParent.get(k).push(c)
  }

  return roots.map((r) => ({
    ...r,
    children: byParent.get(String(r._id)) || [],
  }))
}
