// Lapisan layanan rencana kunjungan untuk manager/admin: antrean persetujuan, semua rencana, buat jadwal.
import { ref } from 'vue'
import type { Plan } from './agent-plans'
import { api } from './http'

/** Jumlah pengajuan Menunggu persetujuan, untuk lencana di menu samping (FR-22). */
export const pendingPlanCount = ref(0)
export async function refreshPendingPlanCount(): Promise<void> {
  const { items } = await api<{ total: number; items: Plan[] }>('/visit-plans?upcoming=true')
  pendingPlanCount.value = items.filter((p) => p.status === 'PENDING').length
}

export type { Plan, PlanStatus } from './agent-plans'
export { planStatusChip, sourceChip } from './agent-plans'

export interface PlanListFilter {
  from?: string | null
  to?: string | null
  agentId?: number | null
  schoolId?: number | null
  source?: 'SELF' | 'MANAGER' | null
  upcoming?: boolean
}

export interface PlanDecisionDetail {
  plan: Plan
  school: { id: number; name: string; npsn: string; jenjang: string; package: string; city: string | null; address: string | null; picName: string | null; picContact: string | null } | null
  holder: { id: number; name: string } | null
  currentContract: { id: number; start: string; end: string; value: number } | null
  recentVisits: { id: number; agentId: number; agentName: string; checkInAt: string; checkOutAt: string | null; status: 'ONGOING' | 'DONE' }[]
}

export function qs(f: PlanListFilter): string {
  const p = new URLSearchParams()
  if (f.from) p.set('from', f.from)
  if (f.to) p.set('to', f.to)
  if (f.agentId) p.set('agentId', String(f.agentId))
  if (f.schoolId) p.set('schoolId', String(f.schoolId))
  if (f.source) p.set('source', f.source)
  if (f.upcoming !== undefined) p.set('upcoming', String(f.upcoming))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const managerPlans = {
  async list(filter: PlanListFilter = {}): Promise<Plan[]> {
    const { items } = await api<{ total: number; items: Plan[] }>(`/visit-plans${qs(filter)}`)
    return items
  },
  async decision(id: number): Promise<PlanDecisionDetail> {
    return api<PlanDecisionDetail>(`/visit-plans/${id}/decision`)
  },
  async approve(id: number, note: string): Promise<Plan> {
    const { plan } = await api<{ plan: Plan }>(`/visit-plans/${id}/approve`, { method: 'POST', body: { note: note.trim() || undefined } })
    return plan
  },
  async reject(id: number, note: string): Promise<Plan> {
    const { plan } = await api<{ plan: Plan }>(`/visit-plans/${id}/reject`, { method: 'POST', body: { note: note.trim() } })
    return plan
  },
  /** Jadwal dari manager/admin: langsung Terjadwal, termasuk untuk sekolah di luar tugas agent (FR-1/US-1). */
  async createSchedule(input: { agentId: number; schoolId: number; planDate: string; purpose: string }): Promise<Plan> {
    const { plan } = await api<{ plan: Plan }>('/visit-plans', { method: 'POST', body: input })
    return plan
  },
}
