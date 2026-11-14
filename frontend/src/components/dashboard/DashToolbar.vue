<script setup lang="ts">
import { computed } from 'vue'
import type { DashAgent } from '@/mocks/dashboard'
import type { PeriodKey } from './period'

// Baris atas dashboard: pilihan periode + penggeser periode di kiri, filter agent (banyak pilihan) di kanan.
const props = defineProps<{ label: string; agents: DashAgent[] }>()
const period = defineModel<PeriodKey>('period', { required: true })
const selected = defineModel<number[]>('selected', { required: true })
defineEmits<{ prev: []; next: [] }>()

const options: { key: PeriodKey; label: string }[] = [
  { key: 'day', label: 'Hari' },
  { key: 'week', label: 'Minggu' },
  { key: 'month', label: 'Bulan' },
]
const filterLabel = computed(() => {
  if (!selected.value.length || selected.value.length === props.agents.length) return `Semua agent (${props.agents.length})`
  if (selected.value.length === 1) return props.agents.find((a) => a.id === selected.value[0])?.name ?? ''
  return `${selected.value.length} agent dipilih`
})
function toggle(id: number) {
  selected.value = selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id]
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__left">
      <div class="toolbar__tabs" role="tablist" aria-label="Periode">
        <button v-for="o in options" :key="o.key" type="button" role="tab" class="toolbar__tab" :class="{ 'toolbar__tab--active': period === o.key }" :aria-selected="period === o.key" @click="period = o.key">{{ o.label }}</button>
      </div>
      <button type="button" class="toolbar__arrow" aria-label="Periode sebelumnya" @click="$emit('prev')"><v-icon icon="mdi-chevron-left" size="20" /></button>
      <span class="toolbar__label" data-testid="period-label">{{ label }}</span>
      <button type="button" class="toolbar__arrow" aria-label="Periode berikutnya" @click="$emit('next')"><v-icon icon="mdi-chevron-right" size="20" /></button>
    </div>
    <v-menu :close-on-content-click="false">
      <template #activator="{ props: menu }">
        <v-btn v-bind="menu" class="toolbar__filter" variant="outlined" prepend-icon="mdi-account-multiple-outline" append-icon="mdi-chevron-down" data-testid="agent-filter">{{ filterLabel }}</v-btn>
      </template>
      <v-list density="compact" min-width="220">
        <v-list-item v-for="a in agents" :key="a.id" :title="a.name" @click="toggle(a.id)">
          <template #prepend>
            <v-checkbox-btn :model-value="!selected.length || selected.includes(a.id)" density="compact" tabindex="-1" @click.stop="toggle(a.id)" />
          </template>
        </v-list-item>
        <v-divider />
        <v-list-item title="Semua agent" @click="selected = []" />
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.toolbar__left { display: flex; align-items: center; gap: 16px; }
.toolbar__tabs { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgb(var(--v-theme-canvas-alt)); }
.toolbar__tab { padding: 8px 16px; border-radius: 999px; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.toolbar__tab--active { background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-secondary)); font-weight: 600; }
.toolbar__arrow { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 1px solid rgb(var(--v-theme-border)); border-radius: 999px; background: rgb(var(--v-theme-surface)); }
.toolbar__filter { color: rgb(var(--v-theme-on-surface)) !important; font-weight: 500; }
.toolbar__label { font-size: 14px; line-height: 20px; font-weight: 600; }
</style>
