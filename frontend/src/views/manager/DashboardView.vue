<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ActivityChart from '@/components/dashboard/ActivityChart.vue'
import AgentRanking from '@/components/dashboard/AgentRanking.vue'
import AttentionCard from '@/components/dashboard/AttentionCard.vue'
import ContributionCard from '@/components/dashboard/ContributionCard.vue'
import DashToolbar from '@/components/dashboard/DashToolbar.vue'
import PeriodVisitsCard from '@/components/dashboard/PeriodVisitsCard.vue'
import RetentionCard from '@/components/dashboard/RetentionCard.vue'
import UnvisitedCard from '@/components/dashboard/UnvisitedCard.vue'
import { comparisonSentence, periodRange, type PeriodKey } from '@/components/dashboard/period'
import StatCard from '@/components/StatCard.vue'
import type { ChartTab } from '@/mocks/dashboard'
import { dashboardToday, listPeriodVisits, loadDashboard, type DashData } from '@/services/dashboard'
import type { VisitRow } from '@/services/manager'

// Dashboard manager (Figma: Manager – Dashboard). Satu pemuatan data per periode lewat services/dashboard.ts.
const period = ref<PeriodKey>('week')
const offset = ref(0)
const tab = ref<ChartTab>('visits')
const selectedAgents = ref<number[]>([])
const rows = ref<VisitRow[]>([])
const data = ref<DashData | null>(null)

const today = dashboardToday()
const range = computed(() => periodRange(period.value, today, offset.value))
const sentence = computed(() => comparisonSentence(period.value, today, offset.value))
const agents = computed(() => data.value?.agents ?? [])
const annual = computed(() => data.value?.annual)
const stats = computed(() => data.value?.stats)
const chart = computed(() => data.value?.charts[tab.value])
const ids = <T extends { agentId?: number; id?: number }>(rows_: T[], key: 'agentId' | 'id'): T[] => (selectedAgents.value.length ? rows_.filter((r) => selectedAgents.value.includes(Number(r[key]))) : rows_)
const ranking = computed(() => ids(agents.value, 'id').slice().sort((a, b) => b.retentionPct - a.retentionPct))
const attention = computed(() => {
  const names = agents.value.filter((a) => !selectedAgents.value.length || selectedAgents.value.includes(a.id)).map((a) => a.name.split(' ')[0]!)
  return (data.value?.attention ?? []).filter((i) => !selectedAgents.value.length || names.includes(i.agent))
})
const unvisited = computed(() => ids(data.value?.unvisited ?? [], 'agentId'))
const contribAgents = computed(() => ids(agents.value, 'id'))

watch(period, () => (offset.value = 0))
watch([period, offset], async () => (data.value = await loadDashboard(period.value, offset.value)), { immediate: true })
watch([range, selectedAgents], async () => (rows.value = await listPeriodVisits(range.value, selectedAgents.value)), { immediate: true })
</script>

<template>
  <div v-if="data && annual && stats && chart" class="dash">
    <DashToolbar v-model:period="period" v-model:selected="selectedAgents" :label="range.label" :agents="agents" @prev="offset--" @next="offset++" />
    <p class="dash__caption">{{ sentence }}</p>

    <h2 class="dash__section">Tahunan • tidak ikut pilihan periode</h2>
    <div class="dash__two">
      <RetentionCard :data="annual" />
      <AttentionCard :items="attention" />
    </div>

    <h2 class="dash__section">Periode terpilih • {{ range.label }}</h2>
    <div class="dash__stats">
      <StatCard label="Perpanjangan ditandatangani" :value="stats.renewal.value" icon="mdi-file-document-edit-outline" tone="brand" :change="{ direction: stats.renewal.direction, label: stats.renewal.change }" :comparison="stats.renewal.comparison" />
      <StatCard label="Kunjungan selesai" :value="stats.visits.value" icon="mdi-map-marker-outline" tone="success" :change="{ direction: stats.visits.direction, label: stats.visits.change }" :comparison="stats.visits.comparison" />
      <StatCard label="Sekolah dikunjungi" :value="stats.schools.value" icon="mdi-school-outline" tone="info" :change="{ direction: stats.schools.direction, label: stats.schools.change }" :comparison="stats.schools.comparison" />
      <StatCard label="Total durasi" :value="stats.duration.value" icon="mdi-timer-outline" tone="accent" :change="{ direction: stats.duration.direction, label: stats.duration.change }" :comparison="stats.duration.comparison" />
      <StatCard label="Ditugaskan : lainnya" :value="stats.ratio.value" icon="mdi-swap-horizontal" tone="warning" :comparison="stats.ratio.note" />
    </div>

    <div class="dash__two">
      <ActivityChart v-model:tab="tab" :data="chart" />
      <ContributionCard :agents="contribAgents" :target-jt="annual.targetJt" :retained-jt="annual.retainedJt" />
    </div>

    <AgentRanking :agents="ranking" :year="annual.year" />
    <UnvisitedCard :schools="unvisited" :period-label="range.label" />
    <PeriodVisitsCard :rows="rows" />
  </div>
</template>

<style scoped>
.dash { display: flex; flex-direction: column; gap: 24px; }
.dash__caption { margin-top: -8px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.dash__section { margin-bottom: -8px; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.dash__two { display: grid; grid-template-columns: minmax(0, 1fr) 452px; gap: 24px; align-items: stretch; }
.dash__stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
</style>
