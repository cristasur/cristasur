// ============================================================
// CategoryGrid — cuadrícula de categorías con líneas divisorias.
//
// Un solo contenedor con borde, partido en celdas iguales. Cada
// celda lleva la imagen en círculo y el nombre debajo.
//
// Sin desplegables ni estado: al hacer clic te lleva a la
// categoría, nada más. Los desplegables con subcategorías viven
// en la barra de navegación y en el botón "Categorías".
//
// Las celdas sobrantes de la última fila se rellenan vacías para
// que las líneas no queden cortadas a la mitad.
// ============================================================
import Link from 'next/link'

// Columnas: 3 en celular y tablet (como MAHA), 4 en escritorio.
// Si cambias esto, cambia también las clases grid-cols de abajo.
const COLS_CEL = 3
const COLS_LG = 4

const sobrantes = (n, cols) => (n % cols === 0 ? 0 : cols - (n % cols))

export default function CategoryGrid({ categories = [] }) {
  if (!categories.length) return null

  const fillersCel = sobrantes(categories.length, COLS_CEL)
  const fillersLg = sobrantes(categories.length, COLS_LG)
  const fillers = Math.max(fillersCel, fillersLg)

  return (
    // El borde superior e izquierdo va en el contenedor y cada celda aporta
    // el derecho e inferior: así las líneas quedan de un pixel y sin dobles.
    <div className="rounded-2xl overflow-hidden border-t border-l border-slate-200 bg-white grid grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c._id}
          href={`/categoria/${c.slug}`}
          className="group border-r border-b border-slate-200 px-1.5 py-4 sm:px-4 sm:py-6 flex flex-col items-center text-center transition-colors hover:bg-slate-50 active:bg-slate-100"
        >
          {/* Imagen en círculo con degradado suave detrás */}
          <div className="w-[72px] h-[72px] sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-slate-50 to-slate-200/70 grid place-items-center overflow-hidden shrink-0">
            {c.image ? (
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : c.icon ? (
              <span className="text-4xl">{c.icon}</span>
            ) : (
              <span className="text-3xl font-black text-brand-700">
                {c.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Nombre: alto reservado para 2 líneas, así todas las celdas
              miden lo mismo aunque el nombre sea largo. */}
          <div
            className="mt-3 sm:mt-4 text-[13px] sm:text-[13.5px] md:text-[14.5px] leading-tight sm:leading-snug line-clamp-2 text-slate-800 group-hover:text-brand-600 transition-colors"
            style={{ minHeight: '2.6em' }}
          >
            {c.name}
          </div>
        </Link>
      ))}

      {/* Celdas vacías para cerrar la última fila */}
      {/* Celdas vacías para cerrar la última fila: las que hacen falta
          en celular (3 columnas) y en escritorio (4) son distintas. */}
      {Array.from({ length: fillers }).map((_, i) => (
        <div
          key={`filler-${i}`}
          aria-hidden="true"
          className={`border-r border-b border-slate-200
            ${i < fillersCel ? 'block' : 'hidden'} ${i < fillersLg ? 'lg:block' : 'lg:hidden'}`}
        />
      ))}
    </div>
  )
}
