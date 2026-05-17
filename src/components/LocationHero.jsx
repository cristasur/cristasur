'use client'
// Imagen hero de una sucursal con fallback automático al iframe del
// mapa si la imagen aún no existe en /public/locations/.
import { useState } from 'react'

export default function LocationHero({ image, embedSrc, name, badge, mapsUrl }) {
  const [showImage, setShowImage] = useState(Boolean(image))

  return (
    <div className="aspect-video bg-slate-100 relative overflow-hidden">
      {showImage ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full group"
          title={`Ver ${name} en Google Maps`}
        >
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setShowImage(false)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow flex items-center gap-1">
              📍 Ver en Google Maps
            </span>
          </div>
        </a>
      ) : (
        <iframe
          src={embedSrc}
          width="100%"
          height="100%"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="border-0 absolute inset-0"
          title={`Mapa de ${name}`}
        />
      )}
      {badge && (
        <span className="absolute top-3 left-3 bg-brand-600 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full shadow">
          {badge}
        </span>
      )}
    </div>
  )
}
