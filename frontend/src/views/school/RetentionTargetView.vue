<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatusChip, { type ChipTone } from '@/components/StatusChip.vue'
import SchoolCard from '@/components/school/SchoolCard.vue'
import { formatCompactRupiah, parseTargetPercent, targetValue } from '@/components/school/target-rules'
import type { MockTargetYear } from '@/mocks/school'
import { listTargets, saveTarget } from '@/services/school'
import { formatPercent } from '@/utils/format'

// Target retention (Figma 23:1633). Angka kohort dan retention adalah data tiruan; rumus aslinya di backend.
const years = ref<MockTargetYear[]>([])
const year = ref<string | null>(null)
const percent = ref('')
const submitted = ref(false)
const snack = ref({ show: false, text: '' })

const statusChip: Record<MockTargetYear['status'], { label: string; tone: ChipTone }> = {
  NONE: { label: 'Belum ada data', tone: 'neutral' }, ON_TARGET: { label: 'Sesuai target', tone: 'success' }, BELOW: { label: 'Di bawah target', tone: 'error' },
}
const yearItems = computed(() => years.value.map((y) => ({ title: String(y.year), value: String(y.year) })))
const parsed = computed(() => parseTargetPercent(percent.value))
const error = computed(() => (submitted.value && parsed.value === null ? 'Persentase target harus lebih dari 0 dan paling banyak 100' : ''))

async function load() {
  years.value = await listTargets()
  if (!year.value && years.value.length) year.value = String(years.value[0]?.year)
}
onMounted(load)
watch(year, (y) => {
  submitted.value = false
  const row = years.value.find((r) => String(r.year) === y)
  if (row) percent.value = String(row.targetPercent).replace('.', ',')
})
watch(years, () => {
  const row = years.value.find((r) => String(r.year) === year.value)
  if (row && !percent.value) percent.value = String(row.targetPercent)
})

async function save() {
  submitted.value = true
  if (parsed.value === null || !year.value) return
  await saveTarget(Number(year.value), parsed.value)
  await load()
  snack.value = { show: true, text: `Target ${year.value} disimpan: ${parsed.value.toLocaleString('id-ID')}%` }
}
const howTo = [
  'Retention = nilai perpanjangan yang sudah ditandatangani ÷ nilai kontrak kohort. Tidak dibatasi 100%.',
  'Target = persentase target × total nilai kontrak kohort.',
  'Status dihitung dari kontrak yang sudah diputuskan: sudah diperpanjang atau sudah lewat tanggal berakhir.',
  'Pilihan Hari, Minggu, Bulan di dashboard tidak mengubah angka ini.',
]
</script>

<template>
  <div class="target">
    <SchoolCard title="Persentase target per tahun" subtitle="Kohort tahun T = kontrak yang tanggal berakhirnya jatuh di tahun T (WIB)">
      <div class="target__table">
        <table>
          <thead>
            <tr>
              <th class="c-year">Tahun</th><th class="c-target">Target</th><th class="c-num">Nilai kohort</th><th class="c-num">Target nilai</th>
              <th class="c-sign">Ditandatangani</th><th class="c-ret">Retention</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="y in years" :key="y.year" data-testid="target-row">
              <td class="c-year"><strong>{{ y.year }}</strong></td>
              <td class="c-target"><strong>{{ y.targetPercent.toLocaleString('id-ID') }}%</strong><StatusChip v-if="y.isDefault" label="Default" class="target__default" /></td>
              <td class="c-num">{{ formatCompactRupiah(y.cohortValue) }}</td>
              <td class="c-num">{{ formatCompactRupiah(targetValue(y.targetPercent, y.cohortValue)) }}</td>
              <td class="c-sign">{{ formatCompactRupiah(y.signedValue) }}</td>
              <td class="c-ret">{{ formatPercent(y.retention) }}</td>
              <td><StatusChip :label="statusChip[y.status].label" :tone="statusChip[y.status].tone" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </SchoolCard>

    <div class="target__row">
      <SchoolCard :title="`Ubah target ${year ?? ''}`">
        <form class="target__form" novalidate @submit.prevent="save">
          <LabeledSelect id="tg-year" v-model="year" label="Tahun" :items="yearItems" />
          <div>
            <LabeledField id="tg-percent" v-model="percent" label="Persentase target (%)" inputmode="decimal" :error-messages="error" />
            <p class="target__hint">Default 65%. Berlaku untuk manager dan semua agent di tahun itu.</p>
          </div>
          <v-btn type="submit" block>Simpan target</v-btn>
        </form>
      </SchoolCard>
      <SchoolCard title="Cara hitung">
        <ul class="target__how">
          <li v-for="h in howTo" :key="h"><v-icon icon="mdi-check" size="20" color="primary" /><span>{{ h }}</span></li>
        </ul>
      </SchoolCard>
    </div>
    <v-snackbar v-model="snack.show" :timeout="3500" color="primary" location="bottom">{{ snack.text }}</v-snackbar>
  </div>
</template>

<style scoped>
.target { display: flex; flex-direction: column; gap: 24px; }
.target__table { border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
.target__table table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 14px; }
.target__table th { height: 47px; padding: 0 16px; text-align: left; font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); background: rgb(var(--v-theme-canvas-table)); }
.target__table td { height: 52px; padding: 0 16px; border-top: 1px solid rgb(var(--v-theme-border-subtle)); white-space: nowrap; }
.target__table .c-year { width: 120px; }
.target__table .c-target { width: 141px; text-align: right; }
.target__table .c-target strong { display: inline-block; }
.target__table .c-num { width: 130px; text-align: right; }
.target__table .c-sign { width: 139px; text-align: right; }
.target__table .c-ret { width: 111px; text-align: right; }
.target__default { margin-left: 8px; }
.target__row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
.target__form { display: flex; flex-direction: column; gap: 16px; }
.target__hint { margin-top: 6px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.target__how { display: flex; flex-direction: column; gap: 12px; list-style: none; padding: 0; font-size: 14px; line-height: 20px; }
.target__how li { display: flex; gap: 8px; }
.target__how .v-icon { margin-top: 0; flex: none; }
.target :deep(.v-field__input) { opacity: 1; }
.target :deep(.v-input__details) { padding-inline: 0; }
</style>
