import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { authenticate, requireRole } from '../middleware/auth.js'
import { commitImport, previewImport, templateCsv } from '../services/csv-import.service.js'
import { buildContractsCsv, buildSchoolsCsv, buildVisitsCsv, exportLog, logExport, type CsvResult } from '../services/export.service.js'
import { dateKey } from '../validators/common.js'

const ctx = (req: Request) => ({ ip: req.ip, userAgent: req.headers['user-agent'] })
const body = z.object({ csv: z.string().min(1).max(5_000_000) })
const num = z.coerce.number().int().positive().optional()

export const csvRouter = Router()
const guard = [authenticate, requireRole('ADMIN', 'MANAGER')]

// Impor: JSON { csv } (teks file); batas 6 MB diatur di app.ts khusus /api/import.
csvRouter.get('/import/schools/template', ...guard, (_req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="template-impor-sekolah.csv"')
  res.send(templateCsv())
})
csvRouter.post('/import/schools/preview', ...guard, async (req, res, next) => {
  try { res.json(await previewImport(body.parse(req.body).csv)) } catch (e) { next(e) }
})
csvRouter.post('/import/schools/commit', ...guard, async (req, res, next) => {
  try { res.json(await commitImport(req.user!, body.parse(req.body).csv, ctx(req))) } catch (e) { next(e) }
})

// Ekspor: `dryRun=1` hanya menghitung baris (tanpa unduh, tanpa audit).
async function send(req: Request, res: Response, kind: string, filter: string, file: string, build: () => Promise<CsvResult>) {
  const r = await build()
  if (req.query.dryRun === '1') return void res.json({ rows: r.rows })
  await logExport(req.user!, kind, filter, r.rows, ctx(req))
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${file}"`)
  res.setHeader('X-Row-Count', String(r.rows))
  res.send(r.content)
}
csvRouter.get('/export/schools', ...guard, async (req, res, next) => {
  try {
    const q = z.object({ jenjangId: num, status: z.enum(['RENEWED', 'EXPIRED', 'ENDING_SOON', 'RUNNING']).optional(), label: z.string().max(100).optional() }).parse(req.query)
    await send(req, res, 'Data sekolah', q.label || 'Semua', 'data-sekolah.csv', () => buildSchoolsCsv(req.user!, q))
  } catch (e) { next(e) }
})
csvRouter.get('/export/contracts', ...guard, async (req, res, next) => {
  try {
    const q = z.object({ year: z.coerce.number().int().min(2000).max(2100), agentId: num, label: z.string().max(100).optional() }).parse(req.query)
    await send(req, res, 'Riwayat kontrak', q.label || `Tahun berakhir ${q.year}`, 'riwayat-kontrak.csv', () => buildContractsCsv(q))
  } catch (e) { next(e) }
})
csvRouter.get('/export/visits', ...guard, async (req, res, next) => {
  try {
    const q = z.object({ from: dateKey.optional(), to: dateKey.optional(), agentId: num, label: z.string().max(100).optional() }).parse(req.query)
    await send(req, res, 'Rekap kunjungan', q.label || 'Semua', 'rekap-kunjungan.csv', () => buildVisitsCsv(q))
  } catch (e) { next(e) }
})
csvRouter.get('/export/log', ...guard, async (_req, res, next) => {
  try { res.json({ items: await exportLog() }) } catch (e) { next(e) }
})
