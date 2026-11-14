import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { findOngoing } from '@/components/agent/visit-rules'
import type { LocationFix } from '@/components/agent/geolocation'
import { checkInRejection, checkOutRejection } from '@/components/agent/visit-rules'
import { MOCK_NOW_ISO, agentProfile, mockVisits } from '@/mocks/agent'
import type { Visit } from '@/mocks/agent'
import { agentService } from '@/services/agent'

export class VisitError extends Error {}

export const useAgentVisitsStore = defineStore('agent-visits', () => {
  const visits = ref<Visit[]>(structuredClone(mockVisits))
  // Jam "server" tiruan: mulai dari MOCK_NOW_ISO lalu berjalan sesuai waktu nyata.
  const startedAt = Date.now()
  const tick = ref(0)
  setInterval(() => (tick.value += 1), 30_000)
  const now = computed(() => new Date(new Date(MOCK_NOW_ISO).getTime() + (tick.value, Date.now() - startedAt)))

  const ongoing = computed(() => findOngoing(visits.value))
  const sorted = computed(() => [...visits.value].sort((a, b) => b.checkInAt.localeCompare(a.checkInAt)))
  const timezone = agentProfile.timezone

  /** Check-in: foto dan lokasi wajib, dan tidak boleh ada kunjungan lain yang berlangsung. */
  function checkIn(input: { schoolId: number | null; hasPhoto: boolean; location: LocationFix | null }): Visit {
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
    return visit
  }

  return { visits, now, ongoing, sorted, timezone, checkIn, checkOut }
})
