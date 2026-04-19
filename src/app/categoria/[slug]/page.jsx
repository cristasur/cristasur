// ============================================================
// /categoria/:slug - Listado de una categoría
// Redirige internamente al catálogo filtrado para reutilizar la vista
// ============================================================
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CategoryPage({ params }) {
  redirect(`/productos?category=${params.slug}`)
}
