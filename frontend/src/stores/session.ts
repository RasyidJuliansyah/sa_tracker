import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT'

// Sesi sementara dengan data tiruan. Diganti auth store sungguhan di langkah login (backend).
export const useSessionStore = defineStore('session', () => {
  const role = ref<Role>('MANAGER')
  const name = ref('Rina Nurhayati')

  const roleLabel = computed(() => ({ ADMIN: 'Admin', MANAGER: 'Manager', AGENT: 'Agent' })[role.value])
  const initials = computed(() =>
    name.value
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase(),
  )

  function setMock(r: Role) {
    role.value = r
    name.value = { ADMIN: 'Admin Skolla', MANAGER: 'Rina Nurhayati', AGENT: 'Dimas Saputra' }[r]
  }
  return { role, name, roleLabel, initials, setMock }
})
