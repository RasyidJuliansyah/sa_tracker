<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LabeledField from '@/components/LabeledField.vue'
import DialogShell from '@/components/admin/DialogShell.vue'
import type { MockContract } from '@/mocks/school'
import { formatPercent, formatRupiah } from '@/utils/format'
import { hasErrors, renewalRatio, suggestRenewalPeriod, validateRenewal } from './contract-rules'
import DateField from './DateField.vue'
import { formatDay, formatDigits, formatPeriod, parseDigits } from './school-format'
import type { RenewalSave } from '@/services/school'

// Catat perpanjangan (Figma 22:1417). Perpanjangan = kontrak RENEWAL; tanggal tanda tangan wajib; periode tidak tumpang tindih.
const props = defineProps<{ schoolName: string; base: MockContract; schoolContracts: MockContract[] }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ submit: [RenewalSave] }>()

const signedDate = ref('')
const start = ref('')
const end = ref('')
const valueText = ref('')
const note = ref('')
const submitted = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  submitted.value = false
  const period = suggestRenewalPeriod(props.base)
  signedDate.value = ''
  start.value = period.start
  end.value = period.end
  valueText.value = formatDigits(props.base.value)
  note.value = ''
})

const value = computed(() => parseDigits(valueText.value))
const errors = computed(() => validateRenewal({ signedDate: signedDate.value, start: start.value, end: end.value, value: value.value }, props.base, props.schoolContracts))
const shown = (k: 'signedDate' | 'start' | 'end' | 'value') => (submitted.value ? errors.value[k] : '')
const ratio = computed(() => renewalRatio(value.value, props.base.value))

function submit() {
  submitted.value = true
  if (hasErrors(errors.value)) return
  emit('submit', { signedDate: signedDate.value, start: start.value, end: end.value, value: value.value, note: note.value })
  open.value = false
}
</script>

<template>
  <DialogShell v-model="open" title="Catat perpanjangan" :subtitle="schoolName" :width="580" :top="80">
    <form class="renewal" novalidate @submit.prevent="submit">
      <div class="renewal__base">
        <v-icon icon="mdi-file-document-outline" size="22" color="primary" />
        <div>
          <p class="renewal__base-title">Kontrak yang diperpanjang: {{ base.label }}</p>
          <p class="renewal__base-sub">{{ formatPeriod(base.start, base.end) }} • {{ formatRupiah(base.value) }}</p>
        </div>
      </div>
      <DateField id="rn-signed" v-model="signedDate" label="Tanggal tanda tangan klien *" hint="Retention dihitung sejak tanggal ini" :error-messages="shown('signedDate')" />
      <div class="renewal__row">
        <DateField id="rn-start" v-model="start" label="Tanggal mulai *" :error-messages="shown('start')" />
        <DateField id="rn-end" v-model="end" label="Tanggal berakhir *" :error-messages="shown('end')" />
      </div>
      <LabeledField id="rn-value" :model-value="valueText" label="Nilai kontrak (Rp) *" inputmode="numeric" :error-messages="shown('value')" @update:model-value="valueText = formatDigits(parseDigits($event))" />
      <div v-if="value > 0" class="renewal__preview" role="status">
        <v-icon icon="mdi-check-circle-outline" size="22" />
        <div>
          <p class="renewal__preview-title">Retention {{ base.label }}: {{ formatPercent(ratio) }}</p>
          <p class="renewal__preview-sub">
            {{ formatRupiah(value) }} ÷ {{ formatRupiah(base.value) }}. Masuk kohort {{ base.end.slice(0, 4) }} karena {{ base.label }} berakhir {{ formatDay(base.end) }}.
          </p>
        </div>
      </div>
      <p v-if="errors.form && submitted" class="renewal__error" role="alert">{{ errors.form }}</p>
      <p class="renewal__note">Periode tidak boleh tumpang tindih dengan kontrak lain di sekolah ini, dan satu kontrak hanya bisa punya satu perpanjangan.</p>
      <div class="renewal__actions">
        <v-btn variant="outlined" @click="open = false">Batal</v-btn>
        <v-btn type="submit">Simpan perpanjangan</v-btn>
      </div>
    </form>
  </DialogShell>
</template>

<style scoped>
.renewal { display: flex; flex-direction: column; gap: 19px; }
.renewal__base { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 8px; background: rgb(var(--v-theme-background)); }
.renewal__base-title { font-size: 14px; line-height: 20px; font-weight: 600; }
.renewal__base-sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.renewal__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.renewal__preview { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 8px; background: color-mix(in srgb, rgb(var(--v-theme-success-solid)) 10%, white); color: rgb(var(--v-theme-success)); }
.renewal__preview-title { font-size: 14px; line-height: 20px; font-weight: 600; }
.renewal__preview-sub { font-size: 12px; line-height: 16px; }
.renewal__error { font-size: 13px; color: rgb(var(--v-theme-error)); }
.renewal__note { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.renewal__actions { display: flex; justify-content: flex-end; gap: 12px; }
</style>
