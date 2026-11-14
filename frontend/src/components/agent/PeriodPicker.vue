<script setup lang="ts">
import type { PeriodKey } from '@/mocks/agent'

// Pilihan periode Hari/Minggu/Bulan (segmented pill) dengan label periode dan tombol sebelumnya/berikutnya.
defineProps<{ label: string }>()
const model = defineModel<PeriodKey>({ required: true })
defineEmits<{ prev: []; next: [] }>()
const options: { key: PeriodKey; label: string }[] = [
  { key: 'day', label: 'Hari' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
]
</script>

<template>
  <div class="period">
    <div class="period__tabs" role="tablist" aria-label="Periode">
      <button v-for="o in options" :key="o.key" type="button" role="tab" class="period__tab" :class="{ 'period__tab--active': model === o.key }" :aria-selected="model === o.key" @click="model = o.key">
        {{ o.label }}
      </button>
    </div>
    <div class="period__nav">
      <button type="button" class="period__arrow" aria-label="Periode sebelumnya" @click="$emit('prev')"><v-icon icon="mdi-chevron-left" size="20" /></button>
      <span class="period__label">{{ label }}</span>
      <button type="button" class="period__arrow" aria-label="Periode berikutnya" @click="$emit('next')"><v-icon icon="mdi-chevron-right" size="20" /></button>
    </div>
  </div>
</template>

<style scoped>
.period { display: flex; align-items: center; justify-content: space-between; }
.period__tabs { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgb(var(--v-theme-canvas-alt)); }
.period__tab {
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  color: rgb(var(--v-theme-text-secondary));
}
.period__tab--active {
  background: rgb(var(--v-theme-surface));
  border-color: rgb(var(--v-theme-border));
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
}
.period__nav { display: flex; align-items: center; gap: 4px; }
.period__arrow { display: inline-flex; border-radius: 5px; color: rgb(var(--v-theme-text-secondary)); }
.period__label { font-size: 13px; line-height: 18px; font-weight: 500; }
</style>
