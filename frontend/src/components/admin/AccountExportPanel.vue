<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LabeledSelect from './LabeledSelect.vue'
import { listAccountExports, listAccounts } from '@/services/admin'
import { apiText } from '@/services/http'
import { MOCK_AUTH } from '@/stores/session'
import { downloadCsv, toCsv } from '@/components/school/csv'
import { formatDateTimeWib } from '@/components/school/school-format'
import * as mock from '@/services/admin.mock'

// Ekspor CSV akun (pola sama dengan ExportPanel sekolah). Hanya admin.
const roleItems = [
  { title: 'Semua', value: null }, { title: 'Admin', value: 'ADMIN' }, { title: 'Manager', value: 'MANAGER' }, { title: 'Agent', value: 'AGENT' },
]
const statusItems = [
  { title: 'Semua', value: null }, { title: 'Aktif', value: 'ACTIVE' },
  { title: 'Wajib ganti password', value: 'MUST_CHANGE_PASSWORD' }, { title: 'Nonaktif', value: 'INACTIVE' },
]

const role = ref<string | null>(null)
const status = ref<string | null>(null)
const count = ref(0)
const logs = ref<{ id: number; at: string; actor: string; kind: string; filter: string; rows: number }[]>([])
const snack = ref({ show: false, text: '' })

function qs() {
  const p = new URLSearchParams()
  if (role.value) p.set('role', role.value)
  if (status.value) p.set('status', status.value)
  return p
}
async function refresh() {
  const items = await listAccounts({ query: '', role: role.value as never, status: status.value as never })
  count.value = items.length
  logs.value = await listAccountExports()
}
onMounted(refresh)
watch([role, status], refresh)

function label() {
  const r = roleItems.find((i) => i.value === role.value)?.title
  const s = statusItems.find((i) => i.value === status.value)?.title
  return [role.value && `Peran ${r}`, status.value && s].filter(Boolean).join(' • ') || 'Semua'
}
async function exportAccounts() {
  const f = label()
  if (!MOCK_AUTH) {
    const q = qs(); q.set('label', f)
    const r = await apiText(`/export/accounts?${q}`)
    downloadCsv('data-akun.csv', r.text)
    await refresh()
    snack.value = { show: true, text: `Data akun: ${r.rows} baris diunduh dan dicatat di audit log` }
    return
  }
  const items = await listAccounts({ query: '', role: role.value as never, status: status.value as never })
  const body = items.map((a) => [a.name, a.email, a.role, a.timezone, a.status, a.lastLoginLabel])
  const content = toCsv(['Nama', 'Email', 'Peran', 'Zona waktu', 'Status', 'Login terakhir'], body)
  downloadCsv('data-akun.csv', content)
  await mock.addAccountExportLog('Data akun', f, items.length)
  await refresh()
  snack.value = { show: true, text: `Data akun: ${items.length} baris diunduh dan dicatat di audit log` }
}
</script>

<template>
  <div class="exp">
    <div class="exp__info" role="note">
      <v-icon icon="mdi-information-outline" size="22" />
      <p>Ekspor memakai filter yang sedang aktif. Setiap ekspor tercatat di audit log. File UTF-8 dengan BOM, dan sel yang diawali =, +, −, @ dinetralkan supaya tidak jadi rumus.</p>
    </div>
    <v-card class="exp__card">
      <span class="exp__tile"><v-icon icon="mdi-account-multiple-outline" size="22" /></span>
      <h2>Data akun</h2>
      <p class="exp__desc">Nama, email, peran, zona waktu, status, dan login terakhir setiap akun.</p>
      <div class="exp__row">
        <LabeledSelect id="ex-akun-peran" v-model="role" label="Peran" :items="roleItems" />
        <LabeledSelect id="ex-akun-status" v-model="status" label="Status" :items="statusItems" />
      </div>
      <div class="exp__foot"><span data-testid="count-akun">{{ count }} baris</span><v-btn prepend-icon="mdi-download" @click="exportAccounts">Unduh CSV</v-btn></div>
    </v-card>

    <v-card class="exp__log">
      <h2>Ekspor terakhir</h2>
      <div class="exp__table">
        <table>
          <thead><tr><th class="c-at">Waktu</th><th class="c-who">Pelaku</th><th class="c-kind">Jenis</th><th>Filter</th><th class="c-rows">Baris</th></tr></thead>
          <tbody>
            <tr v-for="l in logs" :key="l.id" data-testid="export-log"><td>{{ formatDateTimeWib(l.at) }}</td><td>{{ l.actor }}</td><td>{{ l.kind }}</td><td>{{ l.filter }}</td><td class="c-rows">{{ l.rows }}</td></tr>
          </tbody>
        </table>
      </div>
    </v-card>
    <v-snackbar v-model="snack.show" :timeout="3500" color="primary" location="bottom">{{ snack.text }}</v-snackbar>
  </div>
</template>

<style scoped>
.exp { display: flex; flex-direction: column; gap: 24px; }
.exp__info { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); font-size: 14px; }
.exp__card { display: flex; flex-direction: column; gap: 16px; padding: 24px; max-width: 480px; }
.exp__card h2, .exp__log h2 { font-size: 16px; line-height: 24px; font-weight: 600; }
.exp__tile { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-primary)); }
.exp__desc { margin-top: -8px; font-size: 14px; line-height: 20px; color: rgb(var(--v-theme-text-secondary)); }
.exp__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.exp__foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; font-size: 12px; color: rgb(var(--v-theme-text-secondary)); }
.exp__log { padding: 24px; }
.exp__table { margin-top: 16px; border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
.exp__table table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 14px; }
.exp__table th { height: 47px; padding: 0 16px; text-align: left; font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); background: rgb(var(--v-theme-canvas-table)); }
.exp__table td { height: 52px; padding: 0 16px; border-top: 1px solid rgb(var(--v-theme-border-subtle)); }
.exp__table .c-at { width: 190px; } .exp__table .c-who { width: 200px; } .exp__table .c-kind { width: 200px; } .exp__table .c-rows { width: 100px; text-align: right; }
</style>
