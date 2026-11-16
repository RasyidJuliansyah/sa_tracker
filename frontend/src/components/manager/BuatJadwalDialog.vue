<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import DialogShell from '@/components/admin/DialogShell.vue'
import LabeledField from '@/components/LabeledField.vue'
import { managerPlans } from '@/services/manager-plans'
import { useReferenceStore } from '@/stores/reference'
import { pinia } from '@/plugins/pinia'
import { wibDateKey } from '@/utils/timezone'

// Buat jadwal (manager/admin, US-1/FR-22): langsung Terjadwal, termasuk sekolah di luar tugas agent.
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const ref_ = useReferenceStore(pinia)

const agentId = ref<string | null>(null)
const schoolId = ref<string | null>(null)
const planDate = ref('')
const purpose = ref('')
const submitted = ref(false)
const submitting = ref(false)
const error = ref('')

const today = wibDateKey(new Date())
const maxDate = (() => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 90); return d.toISOString().slice(0, 10) })()

const agentItems = computed(() => ref_.agents.map((a) => ({ title: a.name, value: String(a.id) })))
const schoolItems = computed(() => ref_.schoolOptions.map((s) => ({ title: `${s.name} (NPSN ${s.npsn})`, value: String(s.id) })))
const purposeLen = computed(() => purpose.value.trim().length)
const errors = computed(() => ({
  agentId: !agentId.value ? 'Agent wajib dipilih' : '',
  schoolId: !schoolId.value ? 'Sekolah wajib dipilih' : '',
  planDate: !planDate.value ? 'Tanggal wajib diisi' : '',
  purpose: purposeLen.value < 5 ? 'Tujuan minimal 5 karakter' : purposeLen.value > 255 ? 'Tujuan maksimal 255 karakter' : '',
}))
const valid = computed(() => !errors.value.agentId && !errors.value.schoolId && !errors.value.planDate && !errors.value.purpose)
const shown = (k: keyof typeof errors.value) => (submitted.value ? errors.value[k] : '')

watch(open, (isOpen) => {
  if (!isOpen) return
  submitted.value = false
  error.value = ''
  agentId.value = null
  schoolId.value = null
  planDate.value = ''
  purpose.value = ''
})

async function submit() {
  submitted.value = true
  if (!valid.value) return
  submitting.value = true
  error.value = ''
  try {
    await managerPlans.createSchedule({ agentId: Number(agentId.value), schoolId: Number(schoolId.value), planDate: planDate.value, purpose: purpose.value.trim() })
    open.value = false
    emit('created')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal membuat jadwal.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <DialogShell v-model="open" title="Buat jadwal" subtitle="Jadwal dari manager langsung terjadwal, termasuk untuk sekolah di luar tugas agent." :width="540" :top="100">
    <form class="jadwal" novalidate @submit.prevent="submit">
      <LabeledSelect id="jd-agent" v-model="agentId" label="Agent *" placeholder="Pilih agent" :items="agentItems" :error-messages="shown('agentId')" />
      <LabeledSelect id="jd-sekolah" v-model="schoolId" label="Sekolah *" placeholder="Pilih sekolah" :items="schoolItems" :error-messages="shown('schoolId')" />
      <LabeledField id="jd-tanggal" v-model="planDate" label="Tanggal kunjungan *" type="date" :min="today" :max="maxDate" :error-messages="shown('planDate')" />
      <LabeledField id="jd-tujuan" v-model="purpose" label="Tujuan kunjungan *" multiline counter="255" maxlength="255" :error-messages="shown('purpose')" />
      <p v-if="error" class="jadwal__error" role="alert">{{ error }}</p>
      <div class="jadwal__actions">
        <v-btn variant="outlined" @click="open = false">Batal</v-btn>
        <v-btn type="submit" :loading="submitting">Buat jadwal</v-btn>
      </div>
    </form>
  </DialogShell>
</template>

<style scoped>
.jadwal { display: flex; flex-direction: column; gap: 16px; }
.jadwal__error { font-size: 13px; color: rgb(var(--v-theme-error)); }
.jadwal__actions { display: flex; justify-content: flex-end; gap: 12px; }
</style>
