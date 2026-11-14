// Isi file CSV ekspor. Sel diawali = + - @ dinetralkan di toCsv. Filter aktif ikut menentukan baris.
import { allContracts, allVisits, listAgents, listSchools, type SchoolFilter } from '@/services/school'
import { formatDay, formatPeriod } from './school-format'
import { toCsv } from './csv'
import { renewalOf, renewalRatio } from './contract-rules'

export interface ExportResult { content: string; rows: number }

export async function buildSchoolExport(filter: Pick<SchoolFilter, 'level' | 'status'>): Promise<ExportResult> {
  const list = await listSchools({ query: '', pkg: null, agent: null, ...filter })
  const body = list.map((r) => [
    r.school.npsn, r.school.name, r.school.level, r.school.pkg, r.school.city, r.agent?.name ?? '',
    r.contract ? formatPeriod(r.contract.start, r.contract.end) : '', r.contract?.value ?? '', r.status?.kind ?? '',
  ])
  return { content: toCsv(['NPSN', 'Nama sekolah', 'Jenjang', 'Paket', 'Kota', 'Agent', 'Kontrak berjalan', 'Nilai kontrak', 'Status perpanjangan'], body), rows: body.length }
}

export async function buildContractExport(year: number, agentId: string | null): Promise<ExportResult> {
  const schools = await listSchools({ query: '', level: null, pkg: null, status: null, agent: agentId })
  const byId = new Map(schools.map((r) => [r.school.id, r.school]))
  const all = allContracts()
  const body = all.filter((c) => byId.has(c.schoolId) && Number(c.end.slice(0, 4)) === year).map((c) => {
    const next = renewalOf(c, all)
    return [byId.get(c.schoolId)!.name, c.label, formatDay(c.start), formatDay(c.end), c.value, next?.value ?? '', next ? renewalRatio(next.value, c.value).toFixed(1) : '']
  })
  return { content: toCsv(['Sekolah', 'Kontrak', 'Mulai', 'Berakhir', 'Nilai kontrak', 'Nilai perpanjangan', 'Retention (%)'], body), rows: body.length }
}

export function buildVisitExport(agentId: string | null): ExportResult {
  const agent = listAgents().find((a) => String(a.id) === agentId)?.name
  const body = allVisits().filter((v) => !agent || v.agent === agent).map((v) => [v.date, v.agent, v.schoolId, v.durationMinutes, v.report])
  return { content: toCsv(['Tanggal', 'Agent', 'ID sekolah', 'Durasi (menit)', 'Laporan'], body), rows: body.length }
}
