<script setup lang="ts">
import { computed, ref } from 'vue'
import LabeledField from '@/components/LabeledField.vue'
import { formatDay } from './school-format'

// Field tanggal: tampil "1 Des 2026", memilih lewat pemilih tanggal bawaan browser (input native di atas field).
// Nilai disimpan sebagai 'YYYY-MM-DD'. Input native memakai id `${id}-native` (dipakai tes).
const props = defineProps<{ label: string; id: string; errorMessages?: string; hint?: string }>()
const model = defineModel<string>({ default: '' })
const native = ref<HTMLInputElement | null>(null)
const shown = computed(() => (model.value ? formatDay(model.value) : ''))

function openPicker() {
  try { native.value?.showPicker() } catch { native.value?.focus() }
}
</script>

<template>
  <div class="date-field">
    <LabeledField
      :id="id" :model-value="shown" :label="label" readonly placeholder="Pilih tanggal" :error-messages="errorMessages"
      :hint="hint" :persistent-hint="!!hint" append-inner-icon="mdi-calendar-month-outline" @click="openPicker"
    />
    <input
      :id="`${id}-native`" ref="native" v-model="model" type="date" class="date-field__native" tabindex="-1"
      :aria-label="`Pilih ${props.label.replace(' *', '').toLowerCase()}`" @click="openPicker"
    />
  </div>
</template>

<style scoped>
.date-field { position: relative; }
/* Input native menutupi area field saja (bukan label), tanpa terlihat. */
.date-field__native {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 42px;
  opacity: 0;
  cursor: pointer;
}
.date-field :deep(.v-field) { cursor: pointer; }
.date-field :deep(.v-field__input) { opacity: 1; }
.date-field :deep(.v-input__details) { padding-inline: 0; }
.date-field :deep(.v-messages) { opacity: 1; color: rgb(var(--v-theme-text-secondary)); }
.date-field :deep(.v-input--error .v-messages) { color: rgb(var(--v-theme-error)); }
.date-field :deep(input) { cursor: pointer; }
.date-field :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
</style>
