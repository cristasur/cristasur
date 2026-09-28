'use client'
// ============================================================
// Editor de encuadre de un banner.
//
// Muestra el banner en el mismo recuadro que la portada (compu
// 2000×800, celular cuadrado) y deja:
//   · arrastrar la imagen con mouse o dedo,
//   · acercar/alejar con el zoom,
//   · atajos de posición (esquinas, lados, centro).
// Lo que se ve aquí es exactamente lo que sale en la portada: los
// dos usan lib/encuadre.js.
// ============================================================
import { useRef, useState } from 'react'
import { ENCUADRE_CENTRO, estiloEncuadre, normalizarEncuadre } from '@/lib/encuadre'

const ATAJOS = [
  ['↖', 0, 0], ['↑', 50, 0], ['↗', 100, 0],
  ['←', 0, 50], ['●', 50, 50], ['→', 100, 50],
  ['↙', 0, 100], ['↓', 50, 100], ['↘', 100, 100],
]

export default function EditorEncuadre({ banner, onGuardar, onCerrar }) {
  const tieneCel = Boolean(banner.imageMobile)
  const [vista, setVista] = useState('pc')
  const [pos, setPos] = useState({
    pc: normalizarEncuadre(banner.pos),
    cel: normalizarEncuadre(banner.posMobile),
  })
  const [guardando, setGuardando] = useState(false)
  const arrastre = useRef(null)
  const caja = useRef(null)

  const actual = pos[vista]
  const cambiar = (cambios) =>
    setPos((p) => ({ ...p, [vista]: normalizarEncuadre({ ...p[vista], ...cambios }) }))

  // Arrastrar: mover el mouse a la derecha lleva la imagen a la
  // derecha, o sea, el punto de enfoque se va a la izquierda.
  function alPresionar(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    arrastre.current = { x: e.clientX, y: e.clientY, inicio: actual }
  }
  function alMover(e) {
    if (!arrastre.current || !caja.current) return
    const r = caja.current.getBoundingClientRect()
    const dx = ((e.clientX - arrastre.current.x) / r.width) * 100
    const dy = ((e.clientY - arrastre.current.y) / r.height) * 100
    const k = 1.6 / arrastre.current.inicio.zoom
    cambiar({ x: arrastre.current.inicio.x - dx * k, y: arrastre.current.inicio.y - dy * k })
  }
  function alSoltar() { arrastre.current = null }

  async function guardar() {
    setGuardando(true)
    try {
      await onGuardar({ pos: pos.pc, posMobile: pos.cel })
    } finally {
      setGuardando(false)
    }
  }

  const imagen = vista === 'cel' ? banner.imageMobile : banner.image

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900">Ajustar encuadre</h3>
            <p className="text-xs text-slate-500">Arrastra la imagen para moverla. Así se verá en la portada.</p>
          </div>
          <button onClick={onCerrar} className="text-slate-400 hover:text-slate-700 text-2xl leading-none" aria-label="Cerrar">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Compu / Celular */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold">
            <button onClick={() => setVista('pc')}
              className={`px-4 py-1.5 rounded-md ${vista === 'pc' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
              Compu (2000×800)
            </button>
            <button onClick={() => tieneCel && setVista('cel')} disabled={!tieneCel}
              title={tieneCel ? '' : 'Este banner no tiene imagen de celular'}
              className={`px-4 py-1.5 rounded-md ${vista === 'cel' ? 'bg-white shadow text-slate-900' : 'text-slate-500'} disabled:opacity-40`}>
              Celular (cuadrado)
            </button>
          </div>

          {/* Vista previa, mismo recuadro que la portada */}
          <div className={vista === 'cel' ? 'max-w-sm mx-auto' : ''}>
            <div
              ref={caja}
              className={`relative overflow-hidden rounded-2xl bg-slate-100 cursor-grab active:cursor-grabbing select-none touch-none ${vista === 'cel' ? 'aspect-square' : 'aspect-[2000/800]'}`}
              onPointerDown={alPresionar}
              onPointerMove={alMover}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
            >
              <img src={imagen} alt="" draggable={false}
                className="w-full h-full object-cover pointer-events-none" style={estiloEncuadre(actual)} />
              {/* Guías de tercios, solo de referencia */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => <div key={i} className="border border-white/25" />)}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-start">
            {/* Atajos de posición */}
            <div>
              <span className="block text-xs font-semibold text-slate-600 mb-1.5">Posición rápida</span>
              <div className="grid grid-cols-3 gap-1 w-28">
                {ATAJOS.map(([ic, x, y]) => {
                  const activo = Math.round(actual.x) === x && Math.round(actual.y) === y
                  return (
                    <button key={ic} onClick={() => cambiar({ x, y })} title={ic === '●' ? 'Centrar' : ''}
                      className={`h-8 rounded-md text-sm font-bold border ${activo ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400'}`}>
                      {ic}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Zoom y ajuste fino */}
            <div className="space-y-3">
              <label className="block">
                <span className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Zoom</span><span>{Math.round(actual.zoom * 100)}%</span>
                </span>
                <input type="range" min="1" max="2.5" step="0.05" value={actual.zoom}
                  onChange={(e) => cambiar({ zoom: e.target.value })} className="w-full accent-brand-600" />
              </label>
              <label className="block">
                <span className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Izquierda ↔ Derecha</span><span>{Math.round(actual.x)}%</span>
                </span>
                <input type="range" min="0" max="100" step="1" value={actual.x}
                  onChange={(e) => cambiar({ x: e.target.value })} className="w-full accent-brand-600" />
              </label>
              <label className="block">
                <span className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                  <span>Arriba ↕ Abajo</span><span>{Math.round(actual.y)}%</span>
                </span>
                <input type="range" min="0" max="100" step="1" value={actual.y}
                  onChange={(e) => cambiar({ y: e.target.value })} className="w-full accent-brand-600" />
              </label>
              <p className="text-xs text-slate-400">
                Si la imagen tiene exactamente la medida del recuadro y el zoom está en 100%, no hay nada que mover:
                se ve completa. Acércala con el zoom para poder moverla.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={() => setPos((p) => ({ ...p, [vista]: { ...ENCUADRE_CENTRO } }))}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200">
            Restablecer
          </button>
          <div className="flex gap-2">
            <button onClick={onCerrar} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button onClick={guardar} disabled={guardando}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar encuadre'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
