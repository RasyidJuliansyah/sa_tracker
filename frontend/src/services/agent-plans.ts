import type { ChipTone } from '@/components/StatusChip.vue'
import { MOCK_AUTH } from '@/stores/session'
import { api } from './http'

// Status rencana yang ditampilkan (turunan dari backend).
export type PlanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'DONE' | 'MISSED' | 'EXPIRED'

export interface Plan {
  id: number
  agentId: number
  agentName: string
  schoolId: number
  schoolName: string
  npsn: string
  city: string
  planDate: string // yyyy-mm-dd (WIB)
  purpose: string
  source: 'SELF' | 'MANAGER'
  status: PlanStatus
  decidedBy: string | null
  decidedAt: string | null
  decisionNote: string | null
  visitId: number | null
  createdAt: string
}

/** Label dan nada chip untuk status rencana (teks, bukan hanya warna). */
export function planStatusChip(status: PlanStatus): { label: string; tone: ChipTone } {
  switch (status) {
    case 'PENDING': return { label: 'Menunggu persetujuan', tone: 'warning' }
    case 'APPROVED': return { label: 'Terjadwal', tone: 'info' }
    case 'DONE': return { label: 'Selesai', tone: 'success' }
    case 'REJECTED': return { label: 'Ditolak', tone: 'error' }
    case 'MISSED': return { label: 'Terlewat', tone: 'error' }
    case 'CANCELLED': return { label: 'Dibatalkan', tone: 'neutral' }
    case 'EXPIRED': return { label: 'Kedaluwarsa', tone: 'neutral' }
  }
}

export const sourceChip = (source: Plan['source']): { label: string; tone: ChipTone } =>
  source === 'MANAGER' ? { label: 'Dari manager', tone: 'brand' } : { label: 'Rencana saya', tone: 'neutral' }

/** Rencana yang boleh di-check-in hari ini: Terjadwal dan tanggalnya hari ini (WIB). */
export function isCheckInableToday(plan: Plan, todayWib: string): boolean {
  return plan.status === 'APPROVED' && plan.planDate === todayWib
}

interface CreatePlanInput { schoolId: number; planDate: string; purpose: string }

// Mode tiruan (dev:mock / E2E UI): belum ada data rencana tiruan; kembalikan kosong agar layar tidak crash.
export const agentPlans = {
  async list(upcoming?: boolean): Promise<Plan[]> {
    if (MOCK_AUTH) return []
    const q = upcoming === undefined ? '' : `?upcoming=${upcoming}`
    const { items } = await api<{ total: number; items: Plan[] }>(`/visit-plans${q}`)
    return items
  },
  async get(id: number): Promise<Plan> {
    const { plan } = await api<{ plan: Plan }>(`/visit-plans/${id}`)
    return plan
  },
  async create(input: CreatePlanInput): Promise<Plan> {
    const { plan } = await api<{ plan: Plan }>('/visit-plans', { method: 'POST', body: input })
    return plan
  },
  async cancel(id: number): Promise<Plan> {
    const { plan } = await api<{ plan: Plan }>(`/visit-plans/${id}/cancel`, { method: 'POST' })
    return plan
  },
}
