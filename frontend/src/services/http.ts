import { ref } from 'vue'

// Klien HTTP tipis ke backend. Sesi lewat cookie httpOnly, jadi tidak ada token di JavaScript.
const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3011/api'

/** Pesan galat terakhir untuk snackbar global (App.vue). Login menampilkan galatnya sendiri. */
export const apiErrorMessage = ref('')

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message)
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      method: init.method ?? 'GET',
      credentials: 'include',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    const e = new ApiError(0, 'NETWORK', 'Tidak dapat terhubung ke server. Periksa koneksi Anda.')
    apiErrorMessage.value = e.message
    throw e
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const e = new ApiError(res.status, data?.error?.code ?? 'UNKNOWN', data?.error?.message ?? 'Terjadi kesalahan.')
    if (!path.startsWith('/auth/login') && path !== '/me') apiErrorMessage.value = e.message
    throw e
  }
  return data as T
}
