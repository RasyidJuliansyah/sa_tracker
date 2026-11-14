<script setup lang="ts">
import { computed, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatusChip from '@/components/StatusChip.vue'
import { contractRetention, focusContract, renewalStatus, signedRenewalOf } from '@/components/agent/contracts'
import { formatLastVisit, latestVisitAt } from '@/components/agent/visit-format'
import { filterSchools } from '@/components/agent/visit-rules'
import { agentService } from '@/services/agent'
import { useAgentVisitsStore } from '@/stores/agent-visits'
import { formatPercent } from '@/utils/format'
import { wibDateKey } from '@/utils/timezone'

const store = useAgentVisitsStore()
const query = ref('')
const today = computed(() => wibDateKey(store.now))

const assigned = computed(() => filterSchools(agentService.schools().filter((s) => s.assigned), query.value))
const cards = computed(() =>
  assigned.value.map((s) => {
    const d = agentService.schoolDetail(s.id)!
    const status = renewalStatus(d.contracts, today.value)
    const focus = focusContract(d.contracts, today.value)
    const retention = focus && signedRenewalOf(focus, d.contracts) ? formatPercent(contractRetention(focus, d.contracts)) : null
    return { id: s.id, name: s.name, meta: `${d.level} · Paket ${d.packageName} · ${s.city}`, status, retention, last: formatLastVisit(latestVisitAt(store.visits, s.id, d.lastVisitAt), store.now) }
  }),
)
const total = computed(() => agentService.assignedSchoolIds().length)
</script>

<template>
  <div class="list">
    <LabeledField id="cari" v-model="query" class="search" label="Cari" placeholder="Cari sekolah" append-inner-icon="mdi-magnify" density="compact" variant="outlined" />
    <p class="count">{{ total }} sekolah ditugaskan kepada Anda</p>
    <router-link v-for="c in cards" :key="c.id" :to="`/agent/sekolah/${c.id}`" class="card">
      <div class="card__head">
        <div class="card__tile"><v-icon icon="mdi-school-outline" size="22" /></div>
        <div class="card__body">
          <p class="card__name">{{ c.name }}</p>
          <p class="card__meta">{{ c.meta }}</p>
        </div>
        <v-icon icon="mdi-chevron-right" size="20" class="card__chevron" />
      </div>
      <div v-if="c.status" class="card__chips">
        <StatusChip :label="c.status.label" :tone="c.status.tone" />
        <StatusChip v-if="c.retention" :label="`Retention ${c.retention}`" />
      </div>
      <div class="card__last"><v-icon icon="mdi-clock-outline" size="16" /><span>{{ c.last }}</span></div>
    </router-link>
    <v-card v-if="!cards.length"><EmptyState icon="mdi-school-outline" title="Sekolah tidak ditemukan" description="Coba kata kunci lain untuk nama sekolah." /></v-card>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; gap: 16px; }
.search :deep(.v-field) { background: rgb(var(--v-theme-surface)); }
.search :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
.count { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.card { display: flex; flex-direction: column; gap: 10px; padding: 16px; color: inherit; text-decoration: none; border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; background: rgb(var(--v-theme-surface)); }
.card__head { display: flex; align-items: center; gap: 12px; }
.card__tile { display: flex; align-items: center; justify-content: center; flex: none; width: 40px; height: 40px; border-radius: 8px; background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.card__body { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.card__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.card__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.card__chevron { flex: none; color: rgb(var(--v-theme-text-secondary)); }
.card__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.card__last { display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
</style>
