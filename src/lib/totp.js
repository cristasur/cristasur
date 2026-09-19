// ============================================================
// src/lib/totp.js
// Implementación de TOTP (RFC 6238) sin dependencias externas.
// - Genera secretos (Base32) para enrolar en Google Authenticator,
//   Authy, Microsoft Authenticator, 1Password, Bitwarden, etc.
// - Verifica códigos de 6 dígitos con ventana ±1 (30s) para tolerar
//   pequeños desfases de reloj.
// - Genera el URI otpauth:// que se convierte en QR.
// ============================================================
import crypto from 'crypto'

// ── Base32 (RFC 4648) — sin librería ──────────────────────────────
const B32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Encode(buffer) {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += B32_ALPHABET[(value >>> (bits - 5)) & 0x1f]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += B32_ALPHABET[(value << (5 - bits)) & 0x1f]
  }
  return output
}

function base32Decode(str) {
  const clean = String(str || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '')
  let bits = 0
  let value = 0
  const bytes = []
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch)
    if (idx === -1) continue
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

// ── HOTP → TOTP ───────────────────────────────────────────────────
function hotp(secretBuf, counter) {
  // Contador de 8 bytes big-endian
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter & 0xffffffff, 4)

  const hmac = crypto.createHmac('sha1', secretBuf).update(buf).digest()
  // Dynamic truncation (RFC 4226 sec. 5.3)
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  return String(code % 1_000_000).padStart(6, '0')
}

function counterForTime(nowSec, step = 30) {
  return Math.floor(nowSec / step)
}

// ── API pública ───────────────────────────────────────────────────

/**
 * Genera un nuevo secreto TOTP en base32 (20 bytes de entropía = 32 chars).
 */
export function generateSecret() {
  const bytes = crypto.randomBytes(20)
  return base32Encode(bytes)
}

/**
 * Devuelve el código TOTP actual para un secreto dado.
 * Útil solo para testing. En producción se verifica, no se genera.
 */
export function generateCode(secretBase32, atSec = Date.now() / 1000) {
  const buf = base32Decode(secretBase32)
  return hotp(buf, counterForTime(atSec))
}

/**
 * Verifica un código de 6 dígitos contra un secreto.
 * Acepta ventana ±1 step (30s) para tolerar desfase de reloj.
 * Retorna true si el código es válido, false si no.
 */
export function verifyCode(secretBase32, code, atSec = Date.now() / 1000) {
  if (!secretBase32 || typeof code !== 'string') return false
  const cleanCode = code.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(cleanCode)) return false

  const buf = base32Decode(secretBase32)
  const now = counterForTime(atSec)
  for (const drift of [-1, 0, 1]) {
    if (hotp(buf, now + drift) === cleanCode) return true
  }
  return false
}

/**
 * Construye el URI otpauth:// que las apps autenticadoras leen del QR.
 *   otpauth://totp/CRISTASUR:admin@cristasur.com?secret=XXX&issuer=CRISTASUR
 */
export function otpauthURL({ secret, account, issuer = 'CRISTASUR' }) {
  const label = encodeURIComponent(`${issuer}:${account}`)
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  })
  return `otpauth://totp/${label}?${params.toString()}`
}

/**
 * Genera N códigos de respaldo alfanuméricos (10 caracteres).
 * Sirven cuando el cliente pierde su celular. Se guardan hasheados.
 */
export function generateBackupCodes(count = 10) {
  const codes = []
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(6).toString('hex').toUpperCase()
    // Formato XXXX-XXXXXXXX para mejor legibilidad
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`)
  }
  return codes
}
