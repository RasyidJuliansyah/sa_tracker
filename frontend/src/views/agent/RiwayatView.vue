<script setup lang="ts">
import { computed, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusChip from '@/components/StatusChip.vue'
import { formatVisitClockRange, visitMinutes } from '@/components/agent/visit-format'
import { filterVisitsByRange, groupVisitsByDay } from '@/components/agent/visit-rules'
import type { HistoryRange } from '@/components/agent/visit-rules'
import { agentService } from '@/services/agent'
import { useAgentVisitsStore } from '@/stores/agent-visits'
import { formatDateLong, formatDuration } from '@/utils/format'

const store = useAgentVisitsStore()
const range = ref<HistoryRange>('all')
const filters: { key: HistoryRange; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'week', label: 'Minggu ini' },
  { key: 'month', label: 'Bulan ini' },
]
const groups = computed(() =>
  groupVisitsByDay(filterVisitsByRange(store.visits, range.value, store.now)).map((g) => ({
    day: g.day,
    title: formatDateLong(`${g.day}T12:00:00+07:00`),
    rows: g.visits.map((v) => ({
      id: v.id,
      schoolId: v.schoolId,
      name: v.schoolName,
      ongoing: v.status === 'ONGOING',
      meta: `${formatVisitClockRange(v)} · ${v.status === 'ONGOING' ? 'berjalan ' : ''}${formatDuration(visitMinutes(v, store.now))}`,
      assigned: agentService.isAssigned(v.schoolId),
    })),
  })),
)
</script>

<template>
  <div class="history">
    <div class="filters" role="group" aria-label="Filter periode">
      <button v-for="f in filters" :key="f.key" type="button" class="filters__item" :class="{ 'filters__item--on': range === f.key }" :aria-pressed="range === f.key" @click="range = f.key">{{ f.label }}</button>
    </div>
    <v-card v-if="!groups.length"><EmptyState icon="mdi-history" title="Belum ada kunjungan" description="Kunjungan yang Anda catat pada periode ini akan tampil di sini." /></v-card>
    <template v-for="g in groups" :key="g.day">
      <h2 class="history__day">{{ g.title }}</h2>
      <v-card class="group">
        <router-link v-for="r in g.rows" :key="r.id" :to="`/agent/sekolah/${r.schoolId}`" class="row">
          <div class="row__body">
            <p class="row__name">{{ r.name }}</p>
            <p class="row__meta">{{ r.meta }}</p>
            <div class="row__chips">
              <StatusChip :label="r.ongoing ? 'Berlangsung' : 'Selesai'" :tone="r.ongoing ? 'info' : 'success'" />
              <StatusChip v-if="!r.assigned" label="Tidak ditugaskan" />
            </div>
          </div>
          <v-icon icon="mdi-chevron-right" size="20" class="row__chevron" />
        </router-link>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.history { display: flex; flex-direction: column; gap: 16px; }
.filters { display: flex; gap: 8px; }
.filters__item { min-height: 32px; padding: 6px 14px; border: 1px solid rgb(var(--v-theme-border)); border-radius: 999px; background: rgb(var(--v-theme-surface)); font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.filters__item--on { border-color: transparent; background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.history__day { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.group { padding: 4px 16px; }
.row { display: flex; align-items: center; gap: 12px; padding: 12px 0; min-height: 44px; color: inherit; text-decoration: none; border-bottom: 1px solid rgb(var(--v-theme-border)); }
.row:last-of-type { border-bottom: 0; }
.row__body { display: flex; flex: 1; flex-direction: column; gap: 4px; align-items: flex-start; min-width: 0; }
.row__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.row__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.row__chips { display: flex; gap: 6px; }
.row__chevron { flex: none; color: rgb(var(--v-theme-text-secondary)); }
</style>
