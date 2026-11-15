<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatCard from '@/components/StatCard.vue'
import StatusChip from '@/components/StatusChip.vue'
import { previewAccountImport, summarizeAccountImport, type AccountImportRow } from './account-import-rules'
import { existingAccountEmails } from '@/services/admin'
import { api } from '@/services/http'
import { MOCK_AUTH } from '@/stores/session'
import * as mock from '@/services/admin.mock'

// Impor massal akun (pola sama dengan ImportPanel sekolah). Hanya admin.
const step = ref<'upload' | 'preview' | 'saved'>('upload')
const fileName = ref('')
const rows = ref<AccountImportRow[]>([])
const fileError = ref('')
const filter = ref<'semua' | 'valid' | 'gagal'>('semua')
const page = ref(1)
const perPage = ref(10)
const input = ref<HTMLInputElement | null>(null)
const result = ref({ created: 0, updated: 0 })
const rawText = ref('')

const summary = computed(() => summarizeAccountImport(rows.value))
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

async function load(text: string, name: string) {
  rawText.value = text
  const parsed = MOCK_AUTH ? previewAccountImport(text, existingAccountEmails()) : await api<{ rows: AccountImportRow[]; fileError: string }>('/import/accounts/preview', { method: 'POST', body: { csv: text } })
  fileError.value = parsed.fileError
  if (parsed.fileError) return
  rows.value = parsed.rows
  fileName.value = name
  filter.value = summarizeAccountImport(parsed.rows).failed ? 'gagal' : 'semua'
  page.value = 1
  step.value = 'preview'
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  await load(await file.text(), file.name)
  if (input.value) input.value.value = ''
}
async function save() {
  result.value = MOCK_AUTH ? await mock.commitAccountImport(rows.value) : await api<{ created: number; updated: number }>('/import/accounts/commit', { method: 'POST', body: { csv: rawText.value } })
  step.value = 'saved'
}
function reset() { step.value = 'upload'; rows.value = []; fileError.value = '' }
const pick = () => input.value?.click()
const actionTone = (r: AccountImportRow) => (!r.ok ? 'neutral' : r.isNew ? 'success' : 'brand')
</script>

<template>
  <div class="imp">
    <input id="import-akun-file" ref="input" type="file" accept=".csv,text/csv" class="imp__file" aria-label="Pilih file CSV" @change="onFile" />

    <v-card v-if="step === 'upload'" class="imp__drop">
      <EmptyState title="Unggah file CSV data akun" description="Pilih file CSV. Baris diperiksa lebih dulu dan tidak disimpan sebelum kamu menyetujuinya." icon="mdi-file-upload-outline">
        <div class="imp__drop-actions">
          <v-btn prepend-icon="mdi-upload" @click="pick">Pilih file CSV</v-btn>
          <v-btn variant="outlined" prepend-icon="mdi-download" href="/templates/template-akun.csv" download>Unduh template</v-btn>
        </div>
        <p v-if="fileError" class="imp__error" role="alert">{{ fileError }}</p>
      </EmptyState>
    </v-card>

    <template v-else-if="step === 'preview'">
      <div class="imp__filename">
        <v-icon icon="mdi-file-delimited-outline" size="20" />
        <span>{{ fileName }} • {{ summary.total }} baris</span>
        <button type="button" class="imp__link" @click="pick">Ganti file</button>
      </div>
      <div class="imp__stats">
        <StatCard label="Baris dibaca" :value="String(summary.total)" icon="mdi-file-delimited-outline" tone="brand" />
        <StatCard label="Akun baru" :value="String(summary.created)" icon="mdi-plus" tone="success" />
        <StatCard label="Diperbarui (email sudah ada)" :value="String(summary.updated)" icon="mdi-refresh" tone="info" />
        <StatCard label="Gagal" :value="String(summary.failed)" icon="mdi-alert-circle-outline" tone="warning" />
      </div>
      <div class="imp__warn" role="note">
        <v-icon icon="mdi-alert-outline" size="22" />
        <p>Baris gagal tidak disimpan. Akun yang diperbarui tidak mengubah email/password; pakai Reset password untuk itu.</p>
      </div>
      <div class="imp__chips" role="group" aria-label="Filter baris">
        <button v-for="c in chips" :key="c.value" type="button" class="imp__chip" :class="{ 'imp__chip--on': filter === c.value }" :aria-pressed="filter === c.value" @click="filter = c.value; page = 1">{{ c.label }}</button>
      </div>
      <v-card class="imp__table">
        <table>
          <thead><tr><th class="c-line">Baris</th><th>Nama</th><th>Email</th><th class="c-role">Peran</th><th class="c-act">Aksi</th><th class="c-msg">Keterangan</th></tr></thead>
          <tbody>
            <tr v-for="r in pageRows" :key="r.line" data-testid="import-row">
              <td>{{ r.line }}</td><td>{{ r.name }}</td><td>{{ r.email || '–' }}</td><td>{{ r.role }}</td>
              <td><StatusChip :label="r.isNew ? 'Baru' : 'Perbarui'" :tone="actionTone(r)" /></td>
              <td :class="r.ok ? 'imp__ok' : 'imp__bad'"><v-icon :icon="r.ok ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline'" size="18" />{{ r.message }}</td>
            </tr>
            <tr v-if="!pageRows.length"><td colspan="6"><EmptyState title="Tidak ada baris" description="Tidak ada baris untuk filter ini." /></td></tr>
          </tbody>
        </table>
        <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="shown.length" />
      </v-card>
      <div class="imp__foot">
        <p>Impor tercatat di audit log.</p>
        <v-spacer />
        <v-btn variant="outlined" @click="reset">Batal</v-btn>
        <v-btn prepend-icon="mdi-check" :disabled="summary.total - summary.failed === 0" @click="save">Simpan {{ summary.total - summary.failed }} baris valid</v-btn>
      </div>
    </template>

    <v-card v-else class="imp__drop">
      <EmptyState title="Impor selesai" :description="`${result.created} akun baru ditambahkan dan ${result.updated} akun diperbarui. ${summary.failed} baris gagal tidak disimpan.`" icon="mdi-check-circle-outline">
        <v-btn variant="outlined" @click="reset">Impor file lain</v-btn>
      </EmptyState>
    </v-card>
  </div>
</template>

<style scoped>
.imp { display: flex; flex-direction: column; gap: 24px; }
.imp__file { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
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
.imp__table .c-line { width: 80px; } .imp__table .c-role { width: 110px; } .imp__table .c-act { width: 120px; } .imp__table .c-msg { width: 360px; }
.imp__ok { color: rgb(var(--v-theme-success)); } .imp__bad { color: rgb(var(--v-theme-error)); }
.imp__ok .v-icon, .imp__bad .v-icon { margin-right: 6px; vertical-align: -4px; }
.imp__foot { display: flex; align-items: center; gap: 12px; font-size: 12px; color: rgb(var(--v-theme-text-secondary)); }
.imp__drop { padding: 24px; }
.imp__drop-actions { display: flex; gap: 12px; }
.imp__error { font-size: 13px; color: rgb(var(--v-theme-error)); }
</style>
