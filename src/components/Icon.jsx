// ============================================================
// src/components/Icon.jsx
// Sistema de íconos SVG inline.
// Reemplaza emojis decorativos por íconos consistentes y profesionales.
// Uso:  <Icon name="search" className="w-5 h-5" />
// ============================================================
const icons = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  arrow: <path d="M5 12h14M13 5l7 7-7 7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />,
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </>
  ),
  close: <path d="M18 6 6 18M6 6l12 12" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  truck: (
    <>
      <path d="M5 17h14V7H5z" />
      <path d="M19 10h3l2 3v4h-5" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  shield: <path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4z" />,
  tag: (
    <>
      <path d="M20 12 12 20 2 10V2h8z" />
      <circle cx="7" cy="7" r="1.5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  star: <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
  whatsapp: (
    <path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.2-.7.1-.7 1-.9 1.2-.4.2-.7.1c-.9-.4-1.7-1-2.4-1.6-.6-.6-1.1-1.4-1.5-2.2-.1-.3 0-.4.1-.6s.3-.3.4-.5.2-.3.3-.5.1-.3 0-.5-.6-1.6-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.9.9-1.3 2.1-1.1 3.3.4 1.5 1.3 2.9 2.4 4 1.1 1.1 2.5 1.9 4 2.3h1.6c.5 0 1.5-.6 1.7-1.2.2-.4.2-.9 0-1.4z M12 2a10 10 0 0 0-10 10 10 10 0 0 0 1.5 5.3L2 22l4.9-1.5A10 10 0 0 0 22 12 10 10 0 0 0 12 2z" />
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  phone: (
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2Z" />
  ),
  home: <path d="M3 12 12 4l9 8v9H3z" />,
  chart: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 13l4-4 4 3 5-6" />
    </>
  ),
  bolt: <path d="M13 2 3 14h7l-1 8 10-12h-7z" />,
  fire: (
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s3 1 3 4c0-3 3-6 3-9" />
  ),
  pin: (
    <>
      <path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  sparkle: <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M5 19l4-4M15 9l4-4" />,
}

export default function Icon({ name, className = 'w-5 h-5', strokeWidth = 2 }) {
  const content = icons[name]
  if (!content) return null
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  )
}
