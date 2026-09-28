// ============================================================
// src/lib/instagram.js
// Utilidades para los reels de "Contenido reciente".
//
// · parseInstagram(texto): acepta el link del reel o el código
//   <blockquote class="instagram-media" …> que da Instagram en
//   "Insertar", y regresa { code, kind, url }.
// · fechaInstagram(code): la fecha de publicación sale del propio
//   código del reel (los primeros bits son la hora), sin API.
// · datosInstagram(code): SOLO SERVIDOR. Lee la página pública de
//   inserción del reel y saca la portada y el texto. Se guarda en
//   caché 6 h; si Instagram no responde, regresa {} y la tienda
//   usa lo que se haya capturado a mano.
// ============================================================

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export function parseInstagram(texto = '') {
  const s = String(texto || '')
  const m = s.match(/instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]{5,40})/i)
  if (!m) return null
  const kind = m[1].toLowerCase() === 'p' ? 'p' : 'reel'
  const code = m[2]
  return { code, kind, url: `https://www.instagram.com/${kind}/${code}/` }
}

export function fechaInstagram(code) {
  try {
    if (!code || code.length > 12) return null
    let n = 0n
    for (const ch of code) {
      const i = ALFABETO.indexOf(ch)
      if (i < 0) return null
      n = n * 64n + BigInt(i)
    }
    const ms = Number(n >> 23n) + 1314220021721
    const d = new Date(ms)
    // Solo fechas razonables (Instagram existe desde 2010)
    if (Number.isNaN(d.getTime()) || d.getFullYear() < 2011 || ms > Date.now() + 86400000) return null
    return d.toISOString()
  } catch {
    return null
  }
}

function decodificar(html = '') {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}

export async function datosInstagram(code, kind = 'reel') {
  if (!code) return {}
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 2500)
    const res = await fetch(`https://www.instagram.com/${kind}/${code}/embed/captioned/`, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
      next: { revalidate: 21600 },
    })
    clearTimeout(t)
    if (!res.ok) return {}
    const html = await res.text()

    const img = html.match(/class="EmbeddedMediaImage"[^>]*?src="([^"]+)"/)
    const cover = img ? decodificar(img[1]) : ''

    let caption = ''
    const cap = html.match(/class="Caption"[^>]*>([\s\S]*?)<div class="CaptionComments"/)
    if (cap) {
      caption = decodificar(cap[1].replace(/<a class="CaptionUsername"[\s\S]*?<\/a>/, ''))
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }
    return { cover, caption }
  } catch {
    return {}
  }
}
