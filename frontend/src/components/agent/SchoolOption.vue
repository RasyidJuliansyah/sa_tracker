<script setup lang="ts">
import StatusChip from '@/components/StatusChip.vue'
import type { SchoolLite } from './visit-rules'

// Pilihan sekolah (radio berbentuk kartu). Terpilih: border 2px brand + lingkaran centang.
defineProps<{ school: SchoolLite; selected: boolean }>()
defineEmits<{ select: [] }>()
</script>

<template>
  <button type="button" role="radio" :aria-checked="selected" class="option" :class="{ 'option--selected': selected }" @click="$emit('select')">
    <span class="option__body">
      <span class="option__name">{{ school.name }}</span>
      <span class="option__meta">NPSN {{ school.npsn }} · {{ school.city }}</span>
      <StatusChip v-if="school.assigned" label="Ditugaskan" tone="brand" class="option__chip" />
    </span>
    <span class="option__radio" :class="{ 'option__radio--on': selected }" aria-hidden="true">
      <v-icon v-if="selected" icon="mdi-check" size="16" />
    </span>
  </button>
</template>

<style scoped>
.option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  padding: 12px 16px;
  text-align: left;
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
}
.option--selected {
  padding: 11px 15px;
  border: 2px solid rgb(var(--v-theme-primary));
}
.option__body { display: flex; flex: 1; flex-direction: column; align-items: flex-start; gap: 2px; min-width: 0; }
.option__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.option__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.option__chip { margin-top: 2px; }
.option__radio {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  border: 1px solid rgb(var(--v-theme-border));
  border-radius: 999px;
}
.option__radio--on { border: 0; background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); }
</style>
