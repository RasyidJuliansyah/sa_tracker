import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, ApiError } from '@/services/http'

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT'
export interface SessionUser { id: number; name: string; email: string; role: Role; timezone: 'WIB' | 'WITA' | 'WIT'; mustChangePassword: boolean }

/** Mode tiruan untuk tes UI: hanya saat dev dan VITE_MOCK_AUTH=1. Hapus setelah semua layar memakai API. */
export const MOCK_AUTH = import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === '1'
const MOCK_NAMES: Record<Role, string> = { ADMIN: 'Admin', MANAGER: 'Syifa Mahmudah', AGENT: 'Akhmad Mukhibun' }

export const homeFor = (role: Role) => ({ ADMIN: '/akun', MANAGER: '/dashboard', AGENT: '/agent' })[role]

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null)
  const loaded = ref(false)

  const role = computed<Role>(() => user.value?.role ?? 'MANAGER')
  const name = computed(() => user.value?.name ?? '')
  const roleLabel = computed(() => ({ ADMIN: 'Admin', MANAGER: 'Manager', AGENT: 'Agent' })[role.value])
  const initials = computed(() => name.value.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase())

  async function load() {
    if (loaded.value) return
    try {
      user.value = (await api<{ user: SessionUser }>('/me')).user
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 401) throw e
      user.value = null
    }
    loaded.value = true
  }
  async function login(email: string, password: string) {
    user.value = (await api<{ user: SessionUser }>('/auth/login', { method: 'POST', body: { email, password } })).user
    loaded.value = true
  }
  /** Keluar: hapus cookie di server lalu muat ulang ke /login agar seluruh state (data acuan, cache agent) bersih. */
  async function logout() {
    if (!MOCK_AUTH) await api('/auth/logout', { method: 'POST' }).catch(() => undefined)
    user.value = null
    window.location.assign('/login')
  }
  function setMock(r: Role) {
    user.value = { id: 0, name: MOCK_NAMES[r], email: `${r.toLowerCase()}@mock.local`, role: r, timezone: 'WIB', mustChangePassword: false }
    loaded.value = true
  }
  return { user, loaded, role, name, roleLabel, initials, load, login, logout, setMock }
})
