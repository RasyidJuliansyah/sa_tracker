<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DialogShell from '@/components/admin/DialogShell.vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import LabeledField from '@/components/LabeledField.vue'
import type { MockAgent } from '@/mocks/manager'
import { validateAgentInput, type AgentInput } from '@/services/manager'
import type { IndoTimezone } from '@/utils/timezone'

// Manager – Ubah akun agent (Figma 20:912). Manager hanya mengubah nama, zona waktu, dan status aktif; email hanya admin.
const props = defineProps<{ agent: MockAgent | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ submit: [AgentInput] }>()

const zoneItems = [
  { title: 'WIB (Asia/Jakarta)', value: 'WIB' }, { title: 'WITA (Asia/Makassar)', value: 'WITA' }, { title: 'WIT (Asia/Jayapura)', value: 'WIT' },
]
const name = ref('')
const timezone = ref<string | null>('WIB')
const active = ref(true)
const submitted = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) return
  submitted.value = false
  name.value = props.agent?.name ?? ''
  timezone.value = props.agent?.timezone ?? 'WIB'
  active.value = props.agent?.active ?? true
})

const errors = computed(() => validateAgentInput({ name: name.value, timezone: timezone.value }))
const shown = (key: 'name' | 'timezone') => (submitted.value ? errors.value[key] : '')

function submit() {
  submitted.value = true
  if (errors.value.name || errors.value.timezone) return
  emit('submit', { name: name.value, timezone: timezone.value as IndoTimezone, active: active.value })
  open.value = false
}
</script>

<template>
  <DialogShell v-model="open" title="Ubah akun agent" subtitle="Perubahan tercatat di audit log" :width="520" :top="254">
    <form class="form" novalidate @submit.prevent="submit">
      <LabeledField id="ag-name" v-model="name" label="Nama" :error-messages="shown('name')" />
      <div>
        <LabeledField id="ag-email" :model-value="agent?.email ?? ''" label="Email kantor" readonly append-inner-icon="mdi-lock-outline" />
        <p class="form__hint">Email hanya bisa diubah admin</p>
      </div>
      <LabeledSelect id="ag-tz" v-model="timezone" label="Zona waktu" :items="zoneItems" :error-messages="shown('timezone')" />
      <div class="form__active">
        <label for="ag-active" class="form__active-text">
          <span class="form__active-title">Akun aktif</span>
          <span class="form__active-desc">Akun nonaktif tidak bisa login. Riwayat kunjungan tetap tersimpan.</span>
        </label>
        <v-switch id="ag-active" v-model="active" color="primary" hide-details inset density="compact" aria-label="Akun aktif" />
      </div>
      <div class="form__actions">
        <v-btn variant="outlined" @click="open = false">Batal</v-btn>
        <v-btn type="submit">Simpan perubahan</v-btn>
      </div>
    </form>
  </DialogShell>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 20px; }
.form__hint { margin-top: 6px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.form__active { display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-radius: 5px; background: rgb(var(--v-theme-canvas-table)); }
.form__active-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.form__active-title { font-size: 14px; line-height: 20px; font-weight: 600; }
.form__active-desc { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.form__actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: -4px; }
.form__active :deep(.v-switch__track) { opacity: 1; }
.form__active :deep(.v-selection-control--dirty .v-switch__track) { background: rgb(var(--v-theme-primary)); }
.form :deep(.v-field--readonly input) { color: rgb(var(--v-theme-text-secondary)); }
</style>
