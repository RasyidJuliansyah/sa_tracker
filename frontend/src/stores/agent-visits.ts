import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { findOngoing } from '@/components/agent/visit-rules'
import type { LocationFix } from '@/components/agent/geolocation'
import { checkInRejection, checkOutRejection } from '@/components/agent/visit-rules'
import { MOCK_NOW_ISO, agentProfile, mockVisits } from '@/mocks/agent'
import type { Visit } from '@/mocks/agent'
import { agentService } from '@/services/agent'
import { api, ApiError, fetchImageUrl } from '@/services/http'
import { MOCK_AUTH, useSessionStore } from '@/stores/session'

export class VisitError extends Error {}

export const useAgentVisitsStore = defineStore('agent-visits', () => {
  const visits = ref<Visit[]>(MOCK_AUTH ? structuredClone(mockVisits) : [])
  // Jam "server" tiruan: mulai dari MOCK_NOW_ISO lalu berjalan sesuai waktu nyata.
  const startedAt = Date.now()
  const tick = ref(0)
  setInterval(() => (tick.value += 1), 30_000)
  const now = computed(() => (MOCK_AUTH ? new Date(new Date(MOCK_NOW_ISO).getTime() + (tick.value, Date.now() - startedAt)) : new Date((tick.value, Date.now()))))

  const lastCompleted = ref<Visit | null>(null)
  const ongoing = computed(() => findOngoing(visits.value))
  const sorted = computed(() => [...visits.value].sort((a, b) => b.checkInAt.localeCompare(a.checkInAt)))
  const timezone = MOCK_AUTH ? agentProfile.timezone : (useSessionStore().user?.timezone ?? 'WIB')

  /** Check-in: foto dan lokasi wajib, dan tidak boleh ada kunjungan lain yang berlangsung. */
  function checkIn(input: { schoolId: number | null; hasPhoto: boolean; location: LocationFix | null; photoUrl?: string | null }): Visit {
    const rejection = checkInRejection({ schoolId: input.schoolId, hasPhoto: input.hasPhoto, location: input.location ? 'ok' : 'idle' })
    if (rejection) throw new VisitError(rejection)
    if (ongoing.value) throw new VisitError('Check-in ditolak: masih ada kunjungan yang berlangsung. Check-out dulu.')
    const school = agentService.schools().find((s) => s.id === input.schoolId)
    if (!school) throw new VisitError('Check-in ditolak: sekolah tidak ditemukan.')
    const visit: Visit = {
      id: Math.max(0, ...visits.value.map((v) => v.id)) + 1,
      schoolId: school.id,
      schoolName: school.name,
      checkInAt: now.value.toISOString(),
      checkOutAt: null,
      timezone,
      status: 'ONGOING',
      report: null,
      accuracyM: input.location ? Math.round(input.location.accuracy) : null,
      photoUrl: input.photoUrl ?? null,
    }
    visits.value.push(visit)
    return visit
  }

  /** Check-out menutup kunjungan berlangsung dan wajib membawa laporan. */
  function checkOut(report: string): Visit {
    const rejection = checkOutRejection(report)
    if (rejection) throw new VisitError(rejection)
    const visit = ongoing.value
    if (!visit) throw new VisitError('Tidak ada kunjungan yang berlangsung.')
    visit.checkOutAt = now.value.toISOString()
    visit.status = 'COMPLETED'
    visit.report = report.trim()
    lastCompleted.value = visit
    return visit
  }

  // ---- Mode API ----
  interface ApiVisit { id: number; schoolId: number; schoolName: string; checkInAt: string; checkOutAt: string | null; timezone: Visit['timezone']; status: 'ONGOING' | 'DONE'; report: string | null; accuracyM: number | null }
  const toVisit = (v: ApiVisit, photoUrl: string | null = null): Visit => ({
    id: v.id, schoolId: v.schoolId, schoolName: v.schoolName, checkInAt: v.checkInAt, checkOutAt: v.checkOutAt, timezone: v.timezone,
    status: v.status === 'DONE' ? 'COMPLETED' : 'ONGOING', report: v.report, accuracyM: v.accuracyM, photoUrl,
  })

  async function load() {
    const { items } = await api<{ items: ApiVisit[] }>('/visits?pageSize=100')
    visits.value = items.map((v) => toVisit(v))
    const current = visits.value.find((v) => v.status === 'ONGOING')
    if (current) current.photoUrl = await fetchImageUrl(`/visits/${current.id}/photo`)
  }

  async function checkInApi(input: { schoolId: number | null; file: File | null; location: LocationFix | null }): Promise<Visit> {
    const rejection = checkInRejection({ schoolId: input.schoolId, hasPhoto: Boolean(input.file), location: input.location ? 'ok' : 'idle' })
    if (rejection) throw new VisitError(rejection)
    const fd = new FormData()
    fd.append('schoolId', String(input.schoolId))
    fd.append('lat', String(input.location!.lat))
    fd.append('lng', String(input.location!.lng))
    fd.append('accuracy', String(Math.round(input.location!.accuracy)))
    fd.append('photo', input.file!)
    try {
      const { visit } = await api<{ visit: ApiVisit }>('/visits/check-in', { method: 'POST', body: fd, silent: true })
      const v = toVisit(visit, URL.createObjectURL(input.file!))
      visits.value = [v, ...visits.value]
      return v
    } catch (e) {
      if (e instanceof ApiError) throw new VisitError(e.message)
      throw e
    }
  }

  async function checkOutApi(report: string): Promise<Visit> {
    const rejection = checkOutRejection(report)
    if (rejection) throw new VisitError(rejection)
    const current = ongoing.value
    if (!current) throw new VisitError('Tidak ada kunjungan yang berlangsung.')
    try {
      const { visit } = await api<{ visit: ApiVisit }>(`/visits/${current.id}/check-out`, { method: 'POST', body: { report }, silent: true })
      const done = toVisit(visit, current.photoUrl ?? null)
      visits.value = visits.value.map((v) => (v.id === done.id ? done : v))
      lastCompleted.value = done
      return done
    } catch (e) {
      if (e instanceof ApiError) throw new VisitError(e.message)
      throw e
    }
  }

  return { load, checkInApi, checkOutApi, visits, now, ongoing, sorted, timezone, lastCompleted, checkIn, checkOut }
})
