import { defineStore } from 'pinia'
import { ref } from 'vue'
import { agents as mockAgents, LEVELS, PACKAGES, type MockAgent } from '@/mocks/school'
import { api } from '@/services/http'
import { MOCK_AUTH } from '@/stores/session'

export interface RefItem { id: number; name: string }

/** Data acuan untuk dropdown (jenjang, paket, agent). Dimuat sekali setelah login admin/manager. */
export const useReferenceStore = defineStore('reference', () => {
  const levels = ref<RefItem[]>([])
  const packages = ref<RefItem[]>([])
  const agents = ref<MockAgent[]>([])
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    if (MOCK_AUTH) {
      levels.value = LEVELS.map((name, i) => ({ id: i + 1, name }))
      packages.value = PACKAGES.map((name, i) => ({ id: i + 1, name }))
      agents.value = mockAgents
    } else {
      const [l, p, u] = await Promise.all([
        api<{ items: { id: number; name: string; active: boolean }[] }>('/master/jenjang'),
        api<{ items: { id: number; name: string; active: boolean }[] }>('/master/packages'),
        api<{ items: { id: number; name: string; timezone: MockAgent['timezone']; status: string }[] }>('/users?role=AGENT'),
      ])
      levels.value = l.items.filter((i) => i.active)
      packages.value = p.items.filter((i) => i.active)
      agents.value = u.items.filter((a) => a.status !== 'INACTIVE').map((a) => ({ id: a.id, name: a.name, timezone: a.timezone, retention2026: 0 }))
    }
    loaded.value = true
  }
  return { levels, packages, agents, loaded, load }
})
