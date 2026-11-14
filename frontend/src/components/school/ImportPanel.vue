<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatCard from '@/components/StatCard.vue'
import StatusChip from '@/components/StatusChip.vue'
import { previewImport, summarize, type ImportRow } from './import-rules'
import { commitImport, existingNpsnSet } from '@/services/school'

// Impor CSV (Figma 23:596): pratinjau baris valid dan gagal sebelum disimpan. Baris gagal tidak disimpan.
const step = ref<'upload' | 'preview' | 'saved'>('upload')
const fileName = ref('')
const rows = ref<ImportRow[]>([])
const fileError = ref('')
const filter = ref<'semua' | 'valid' | 'gagal'>('semua')
const page = ref(1)
const perPage = ref(10)
const input = ref<HTMLInputElement | null>(null)
const result = ref({ created: 0, updated: 0 })

const summary = computed(() => summarize(rows.value))
const shown = computed(() => {
  const sorted = [...rows.value].sort((a, b) => Number(a.ok) - Number(b.ok) || a.line - b.line)
  return filter.value === 'semua' ? sorted : sorted.filter((r) => (filter.value === 'valid') === r.ok)
})
const pageRows = computed(() => shown.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
const chips = computed(() => [
  { value: 'semua' as const, label: `Semua (${summary.value.total})` },
  { value: 'valid' as const, label: `Valid (${summary.value.total - summary.value.failed})` },
  { value: 'gagal' as const, label: `Gagal (${summary.value.failed})` },
])

function load(text: string, name: string) {
  const parsed = previewImport(text, existingNpsnSet())
  fileError.value = parsed.fileError
  if (parsed.fileError) return
  rows.value = parsed.rows
  fileName.value = name
  filter.value = summarize(parsed.rows).failed ? 'gagal' : 'semua'
  page.value = 1
  step.value = 'preview'
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  load(await file.text(), file.name)
  if (input.value) input.value.value = ''
}
async function useSample() {
  const res = await fetch('/templates/sekolah-november-2026.csv')
  load(await res.text(), 'sekolah-november-2026.csv')
}
async function save() {
  result.value = await commitImport(rows.value)
  step.value = 'saved'
}
function reset() { step.value = 'upload'; rows.value = []; fileError.value = '' }
const pick = () => input.value?.click()
const actionTone = (r: ImportRow) => (!r.ok ? 'neutral' : r.isNew ? 'success' : 'brand')
</script>

<template>
  <div class="imp">
    <input id="import-file" ref="input" type="file" accept=".csv,text/csv" class="imp__file" aria-label="Pilih file CSV" @change="onFile" />

    <div class="imp__steps" aria-label="Langkah impor">
      <div class="imp__step"><span class="imp__dot imp__dot--done"><v-icon icon="mdi-check" size="16" /></span><b>Unduh template</b></div>
      <span class="imp__line" />
      <div class="imp__step"><span class="imp__dot" :class="step === 'upload' ? 'imp__dot--on' : 'imp__dot--done'"><v-icon v-if="step !== 'upload'" icon="mdi-check" size="16" /><template v-else>2</template></span><b>Unggah file</b></div>
      <span class="imp__line" />
      <div class="imp__step"><span class="imp__dot" :class="step === 'preview' ? 'imp__dot--on' : step === 'saved' ? 'imp__dot--done' : ''"><v-icon v-if="step === 'saved'" icon="mdi-check" size="16" /><template v-else>3</template></span><b>Pratinjau</b></div>
      <span class="imp__line" />
      <div class="imp__step"><span class="imp__dot" :class="{ 'imp__dot--on': step === 'saved' }">4</span><b>Simpan</b></div>
      <v-spacer />
      <div v-if="step === 'preview'" class="imp__filename">
        <v-icon icon="mdi-file-delimited-outline" size="20" />
        <span>{{ fileName }} • {{ summary.total }} baris</span>
        <button type="button" class="imp__link" @click="pick">Ganti file</button>
      </div>
    </div>

    <v-card v-if="step === 'upload'" class="imp__drop">
      <EmptyState title="Unggah file CSV data sekolah" description="Pilih file CSV. Baris diperiksa lebih dulu dan tidak disimpan sebelum kamu menyetujuinya." icon="mdi-file-upload-outline">
        <div class="imp__drop-actions">
          <v-btn prepend-icon="mdi-upload" @click="pick">Pilih file CSV</v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-download" href="/templates/template-sekolah.csv" download>Unduh template</v-btn>
        </div>
        <button type="button" class="imp__link" @click="useSample">Pakai file contoh (sekolah-november-2026.csv)</button>
        <p v-if="fileError" class="imp__error" role="alert">{{ fileError }}</p>
      </EmptyState>
    </v-card>

    <template v-else-if="step === 'preview'">
      <div class="imp__stats">
        <StatCard label="Baris dibaca" :value="String(summary.total)" icon="mdi-file-delimited-outline" tone="brand" />
        <StatCard label="Sekolah baru" :value="String(summary.created)" icon="mdi-plus" tone="success" />
        <StatCard label="Diperbarui (NPSN sudah ada)" :value="String(summary.updated)" icon="mdi-refresh" tone="info" />
        <StatCard label="Gagal" :value="String(summary.failed)" icon="mdi-alert-circle-outline" tone="warning" />
      </div>
      <div class="imp__warn" role="note">
        <v-icon icon="mdi-alert-outline" size="22" />
        <p>Baris gagal tidak disimpan. Perbaiki di file lalu unggah ulang. Perpanjangan kontrak dicatat dari halaman sekolah, bukan lewat impor.</p>
      </div>
      <div class="imp__chips" role="group" aria-label="Filter baris">
        <button v-for="c in chips" :key="c.value" type="button" class="imp__chip" :class="{ 'imp__chip--on': filter === c.value }" :aria-pressed="filter === c.value" @click="filter = c.value; page = 1">{{ c.label }}</button>
      </div>
      <v-card class="imp__table">
        <table>
          <thead><tr><th class="c-line">Baris</th><th class="c-npsn">NPSN</th><th>Nama sekolah</th><th class="c-lv">Jenjang</th><th class="c-pk">Paket</th><th class="c-act">Aksi</th><th class="c-msg">Keterangan</th></tr></thead>
          <tbody>
            <tr v-for="r in pageRows" :key="r.line" data-testid="import-row">
              <td>{{ r.line }}</td><td>{{ r.npsn || '–' }}</td><td>{{ r.name }}</td><td>{{ r.level }}</td><td>{{ r.pkg }}</td>
              <td><StatusChip :label="r.isNew || !r.npsn ? 'Baru' : 'Perbarui'" :tone="actionTone(r)" /></td>
              <td :class="r.ok ? 'imp__ok' : 'imp__bad'"><v-icon :icon="r.ok ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" size="18" />{{ r.message }}</td>
            </tr>
            <tr v-if="!pageRows.length"><td colspan="7"><EmptyState title="Tidak ada baris" description="Tidak ada baris untuk filter ini." /></td></tr>
          </tbody>
        </table>
        <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="shown.length" />
      </v-card>
      <div class="imp__foot">
        <p>Jenjang dan paket dicocokkan dengan nama di tabel master. Impor tercatat di audit log.</p>
        <v-spacer />
        <v-btn variant="outlined" @click="reset">Batal</v-btn>
        <v-btn prepend-icon="mdi-check" :disabled="summary.total - summary.failed === 0" @click="save">Simpan {{ summary.total - summary.failed }} baris valid</v-btn>
      </div>
    </template>

    <v-card v-else class="imp__drop">
      <EmptyState title="Impor selesai" :description="`${result.created} sekolah baru ditambahkan dan ${result.updated} sekolah diperbarui. ${summary.failed} baris gagal tidak disimpan.`" icon="mdi-check-circle-outline">
        <div class="imp__drop-actions">
          <v-btn variant="outlined" @click="reset">Impor file lain</v-btn>
          <v-btn to="/sekolah">Lihat daftar sekolah</v-btn>
        </div>
      </EmptyState>
    </v-card>
  </div>
</template>

<style scoped>
.imp { display: flex; flex-direction: column; gap: 24px; }
.imp__file { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.imp__steps { display: flex; align-items: center; gap: 12px; }
.imp__step { display: flex; align-items: center; gap: 12px; font-size: 14px; }
.imp__step b { font-weight: 600; }
.imp__dot { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; background: rgb(var(--v-theme-canvas-alt)); color: rgb(var(--v-theme-text-secondary)); font-size: 13px; font-weight: 600; }
.imp__dot--done { background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.imp__dot--on { background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); }
.imp__line { flex: 0 1 80px; min-width: 24px; height: 1px; background: rgb(var(--v-theme-border)); }
.imp__filename { display: flex; align-items: center; gap: 8px; font-size: 14px; color: rgb(var(--v-theme-text-secondary)); }
.imp__link { font-size: 13px; line-height: 18px; font-weight: 600; color: rgb(var(--v-theme-primary)); border-radius: 5px; }
.imp__stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.imp__stats :deep(.stat-card__value) { font-size: 24px; }
.imp__warn { display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 16px; border-radius: 8px; background: color-mix(in srgb, rgb(var(--v-theme-warning-solid)) 15%, white); color: rgb(var(--v-theme-warning)); font-size: 14px; }
.imp__chips { display: flex; gap: 8px; margin-top: -8px; }
.imp__chip { height: 34px; padding: 0 16px; border-radius: 999px; border: 1px solid rgb(var(--v-theme-border)); background: rgb(var(--v-theme-surface)); font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.imp__chip--on { background: rgb(var(--v-theme-brand-softer)); border-color: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-primary)); font-weight: 600; }
.imp__table { overflow: hidden; }
.imp__table table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 14px; }
.imp__table th { height: 47px; padding: 0 16px; text-align: left; font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); background: rgb(var(--v-theme-canvas-table)); }
.imp__table td { height: 52px; padding: 0 16px; border-top: 1px solid rgb(var(--v-theme-border-subtle)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.imp__table .c-line { width: 80px; } .imp__table .c-npsn { width: 120px; } .imp__table .c-lv { width: 100px; } .imp__table .c-pk { width: 110px; } .imp__table .c-act { width: 120px; } .imp__table .c-msg { width: 360px; }
.imp__ok { color: rgb(var(--v-theme-success)); } .imp__bad { color: rgb(var(--v-theme-error)); }
.imp__ok .v-icon, .imp__bad .v-icon { margin-right: 6px; vertical-align: -4px; }
.imp__foot { display: flex; align-items: center; gap: 12px; font-size: 12px; color: rgb(var(--v-theme-text-secondary)); }
.imp__drop { padding: 24px; }
.imp__drop-actions { display: flex; gap: 12px; }
.imp__error { font-size: 13px; color: rgb(var(--v-theme-error)); }
</style>
