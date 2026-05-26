'use client'
// ============================================================
// Error boundary de último recurso (si falla incluso el layout).
// Next.js lo renderiza sin el layout raíz, así que debe ser
// autosuficiente (incluir html/body).
// ============================================================
export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#f8fafc',
          color: '#0f172a',
          padding: '40px 16px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: 520,
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>
            Error crítico
          </h1>
          <p style={{ marginTop: 8, color: '#475569' }}>
            La aplicación no pudo iniciar. Recarga la página o intenta más
            tarde.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              padding: '10px 18px',
              borderRadius: 10,
              background: '#0ea5e9',
              color: 'white',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
