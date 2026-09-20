// ============================================================
// GET /api/cron/backup
// Endpoint que dispara Vercel Cron todos los días a las 3 AM.
// Corre backup completo de MongoDB y sube los archivos a
// Cloudflare R2. También limpia backups con más de 30 días.
//
// Seguridad: requiere header Authorization: Bearer <CRON_SECRET>.
// Vercel Cron incluye esta cabecera automáticamente si CRON_SECRET
// está definida como env var. Un admin también puede llamarlo
// manualmente desde el navegador (usando su sesión JWT).
// ============================================================
import { NextResponse } from 'next/server'
import { generateBackup } from '@/lib/backup-generator'
import { r2Upload, r2List, r2Delete } from '@/lib/r2'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Este endpoint puede tardar hasta 60s con muchos productos;
// el maxDuration global en vercel.json cubre esto (30s en Hobby).
// Si empieza a timeout con más datos, se puede migrar a background job.

const RETENTION_DAYS = 30

export async function GET(request) {
  // ── Autorización ──────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization') || ''
  const providedSecret = authHeader.replace(/^Bearer\s+/i, '').trim()
  const isCronRequest = cronSecret && providedSecret === cronSecret

  if (!isCronRequest) {
    // Si no es Vercel Cron, dejamos que un admin logueado también lo dispare manualmente.
    const session = await getCurrentUser()
    if (!session || session.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
  }

  const t0 = Date.now()
  const summary = []

  try {
    // ── Generar archivos en memoria ────────────────────────
    const { stamp, files, summary: genSummary } = await generateBackup()
    summary.push(...genSummary)

    // ── Subir a R2 ─────────────────────────────────────────
    const folder = `backups/${stamp}`
    let uploadedCount = 0
    let uploadedBytes = 0
    for (const f of files) {
      try {
        await r2Upload(`${folder}/${f.name}`, f.buffer, f.contentType)
        uploadedCount++
        uploadedBytes += f.buffer.length
      } catch (e) {
        summary.push(`  UPLOAD FAIL ${f.name}: ${e.message}`)
      }
    }
    summary.push(
      `Subido a R2: ${uploadedCount}/${files.length} archivos, ` +
      `${(uploadedBytes / 1024).toFixed(1)} KB total → ${folder}/`
    )

    // ── Limpieza: borrar backups con más de RETENTION_DAYS días ──
    try {
      const cutoff = Date.now() - RETENTION_DAYS * 24 * 3600 * 1000
      const objects = await r2List('backups/')
      let deleted = 0
      for (const obj of objects) {
        if (obj.LastModified && new Date(obj.LastModified).getTime() < cutoff) {
          try {
            await r2Delete(obj.Key)
            deleted++
          } catch (e) {
            summary.push(`  DELETE FAIL ${obj.Key}: ${e.message}`)
          }
        }
      }
      if (deleted > 0) summary.push(`Cleanup: borrados ${deleted} objetos viejos (>${RETENTION_DAYS}d)`)
    } catch (e) {
      summary.push(`Cleanup: SKIP (${e.message})`)
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    return NextResponse.json({
      ok: true,
      stamp,
      folder,
      elapsedSeconds: elapsed,
      summary,
    })
  } catch (err) {
    console.error('backup cron error', err)
    return NextResponse.json(
      { ok: false, error: err.message, summary },
      { status: 500 }
    )
  }
}
