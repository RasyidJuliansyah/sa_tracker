<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import { addExportLog, listAgents, listExports, listSchools } from '@/services/school'
import { LEVELS, type MockExportLog } from '@/mocks/school'
import { buildContractExport, buildSchoolExport, buildVisitExport } from './export-builders'
import { downloadCsv } from './csv'
import { formatDateTimeWib } from './school-format'

// Ekspor CSV (Figma 23:911): memakai filter yang sedang aktif; setiap ekspor tercatat di audit log.
const levelItems = [{ title: 'Semua', value: null }, ...LEVELS.map((v) => ({ title: v, value: v as string | null }))]
const statusItems = [
  { title: 'Semua', value: null }, { title: 'Berjalan', value: 'RUNNING' }, { title: 'Segera berakhir', value: 'ENDING_SOON' },
  { title: 'Berakhir, belum diperpanjang', value: 'EXPIRED' }, { title: 'Sudah diperpanjang', value: 'RENEWED' },
]
const yearItems = ['2027', '2026', '2025', '2024'].map((y) => ({ title: y, value: y as string | null }))
const rangeItems = [{ title: '1–14 Nov 2026', value: '1–14 Nov 2026' }, { title: '1–7 Nov 2026', value: '1–7 Nov 2026' }]
const agentItems = [{ title: 'Semua', value: null }, ...listAgents().map((a) => ({ title: a.name, value: String(a.id) as string | null }))]

const level = ref<string | null>(null)
const status = ref<string | null>(null)
const year = ref<string | null>('2026')
const contractAgent = ref<string | null>(null)
const range = ref<string | null>('1–14 Nov 2026')
const visitAgent = ref<string | null>(null)
const schoolCount = ref(0)
const contractCount = ref(26)
const visitCount = ref(44)
const logs = ref<MockExportLog[]>([])
const snack = ref({ show: false, text: '' })

async function refresh() {
  schoolCount.value = (await listSchools({ query: '', level: level.value, pkg: null, status: status.value, agent: null })).length
  logs.value = await listExports()
}
onMounted(refresh)
watch([level, status], refresh)

async function done(kind: string, filter: string, rows: number, file: string, content: string) {
  downloadCsv(file, content)
  await addExportLog(kind, filter, rows)
  await refresh()
  snack.value = { show: true, text: `${kind}: ${rows} baris diunduh dan dicatat di audit log` }
}
async function exportSchools() {
  const r = await buildSchoolExport({ level: level.value, status: status.value })
  const f = [level.value && `Jenjang ${level.value}`, status.value && statusItems.find((s) => s.value === status.value)?.title].filter(Boolean).join(' • ')
  await done('Data sekolah', f || 'Semua', r.rows, 'data-sekolah.csv', r.content)
}
async function exportContracts() {
  const r = await buildContractExport(Number(year.value), contractAgent.value)
  const agent = agentItems.find((a) => a.value === contractAgent.value)?.title
  await done('Riwayat kontrak', `Tahun berakhir ${year.value}${contractAgent.value ? ` • ${agent}` : ''}`, r.rows, 'riwayat-kontrak.csv', r.content)
}
async function exportVisits() {
  const r = buildVisitExport(visitAgent.value)
  const agent = agentItems.find((a) => a.value === visitAgent.value)?.title
  await done('Rekap kunjungan', `${range.value} • ${visitAgent.value ? agent : 'semua agent'}`, r.rows, 'rekap-kunjungan.csv', r.content)
}
</script>

<template>
  <div class="exp">
    <div class="exp__info" role="note">
      <v-icon icon="mdi-information-outline" size="22" />
      <p>Ekspor memakai filter yang sedang aktif. Setiap ekspor tercatat di audit log. File UTF-8 dengan BOM, dan sel yang diawali =, +, −, @ dinetralkan supaya tidak jadi rumus.</p>
    </div>
    <div class="exp__cards">
      <v-card class="exp__card">
        <span class="exp__tile"><v-icon icon="mdi-school-outline" size="22" /></span>
        <h2>Data sekolah</h2>
        <p class="exp__desc">Data sekolah beserta kontrak berjalan dan status perpanjangannya.</p>
        <LabeledSelect id="ex-jenjang" v-model="level" label="Jenjang" :items="levelItems" />
        <LabeledSelect id="ex-status" v-model="status" label="Status kontrak" :items="statusItems" />
        <div class="exp__foot"><span data-testid="count-sekolah">{{ schoolCount }} baris</span><v-btn prepend-icon="mdi-download" @click="exportSchools">Unduh CSV</v-btn></div>
      </v-card>
      <v-card class="exp__card">
        <span class="exp__tile"><v-icon icon="mdi-file-document-outline" size="22" /></span>
        <h2>Riwayat kontrak</h2>
        <p class="exp__desc">Semua kontrak dan perpanjangan, dengan retention setiap perpanjangan.</p>
        <LabeledSelect id="ex-tahun" v-model="year" label="Tahun berakhir" :items="yearItems" />
        <LabeledSelect id="ex-agent-kontrak" v-model="contractAgent" label="Agent" :items="agentItems" />
        <div class="exp__foot"><span>{{ contractCount }} baris</span><v-btn prepend-icon="mdi-download" @click="exportContracts">Unduh CSV</v-btn></div>
      </v-card>
      <v-card class="exp__card">
        <span class="exp__tile"><v-icon icon="mdi-clipboard-text-outline" size="22" /></span>
        <h2>Rekap kunjungan</h2>
        <p class="exp__desc">Tanggal, hari, agent, sekolah, jam, durasi, dan status.</p>
        <LabeledSelect id="ex-tanggal" v-model="range" label="Tanggal" :items="rangeItems" />
        <LabeledSelect id="ex-agent-kunjungan" v-model="visitAgent" label="Agent" :items="agentItems" />
        <div class="exp__foot"><span>{{ visitCount }} baris</span><v-btn prepend-icon="mdi-download" @click="exportVisits">Unduh CSV</v-btn></div>
      </v-card>
    </div>

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
.exp__cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.exp__card { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.exp__card h2, .exp__log h2 { font-size: 16px; line-height: 24px; font-weight: 600; }
.exp__tile { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 8px; background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-primary)); }
.exp__desc { margin-top: -8px; font-size: 14px; line-height: 20px; color: rgb(var(--v-theme-text-secondary)); min-height: 40px; }
.exp__foot { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; font-size: 12px; color: rgb(var(--v-theme-text-secondary)); }
.exp__log { padding: 24px; }
.exp__table { margin-top: 16px; border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
.exp__table table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 14px; }
.exp__table th { height: 47px; padding: 0 16px; text-align: left; font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); background: rgb(var(--v-theme-canvas-table)); }
.exp__table td { height: 52px; padding: 0 16px; border-top: 1px solid rgb(var(--v-theme-border-subtle)); }
.exp__table .c-at { width: 190px; } .exp__table .c-who { width: 200px; } .exp__table .c-kind { width: 200px; } .exp__table .c-rows { width: 100px; text-align: right; }
.exp :deep(.v-field__input) { opacity: 1; }
</style>
