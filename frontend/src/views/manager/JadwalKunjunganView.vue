<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import BuatJadwalDialog from '@/components/manager/BuatJadwalDialog.vue'
import { dateRangeKeys, dateRangeLabel } from '@/components/manager/date-range'
import PlanDecisionDialog from '@/components/manager/PlanDecisionDialog.vue'
import StatusChip from '@/components/StatusChip.vue'
import { listAgentOptions, listSchoolOptions } from '@/services/manager'
import { managerPlans, planStatusChip, refreshPendingPlanCount, sourceChip, type Plan } from '@/services/manager-plans'
import { formatDay } from '@/components/school/school-format'

// Jadwal kunjungan (manager/admin, FR-22): tab Menunggu persetujuan dan Semua rencana.
type Tab = 'pending' | 'all'
const tab = ref<Tab>('pending')
const plans = ref<Plan[]>([])
const loading = ref(true)
const createOpen = ref(false)
const decisionOpen = ref(false)
const decisionPlanId = ref<number | null>(null)

const agentItems = [{ title: 'Semua agent', value: null }, ...listAgentOptions().map((a) => ({ title: a.name, value: String(a.id) }))]
const schoolItems = [{ title: 'Semua sekolah', value: null }, ...listSchoolOptions().map((s) => ({ title: s.name, value: String(s.id) }))]
const statusItems = [
  { title: 'Semua status', value: null }, { title: 'Menunggu persetujuan', value: 'PENDING' }, { title: 'Terjadwal', value: 'APPROVED' },
  { title: 'Selesai', value: 'DONE' }, { title: 'Ditolak', value: 'REJECTED' }, { title: 'Dibatalkan', value: 'CANCELLED' },
  { title: 'Terlewat', value: 'MISSED' }, { title: 'Kedaluwarsa', value: 'EXPIRED' },
]
const sourceItems = [{ title: 'Semua sumber', value: null }, { title: 'Dari manager', value: 'MANAGER' }, { title: 'Rencana agent', value: 'SELF' }]

const range = ref<Date[]>([])
const dateMenu = ref(false)
const agent = ref<string | null>(null)
const school = ref<string | null>(null)
const status = ref<string | null>(null)
const source = ref<string | null>(null)
const page = ref(1)
const perPage = ref(10)

const rangeText = computed(() => dateRangeLabel(range.value))
const headers = computed(() => [
  { title: 'Tanggal', key: 'planDate', sortable: false, width: 120 },
  { title: 'Agent', key: 'agentName', sortable: false, width: 160 },
  { title: 'Sekolah', key: 'schoolName', sortable: false },
  { title: 'Tujuan', key: 'purpose', sortable: false },
  { title: 'Sumber', key: 'source', sortable: false, width: 140 },
  { title: 'Status', key: 'status', sortable: false, width: 160 },
  { title: tab.value === 'pending' ? 'Aksi' : '​', key: 'action', sortable: false, width: 110 },
])

async function load() {
  loading.value = true
  try {
    if (tab.value === 'pending') {
      plans.value = (await managerPlans.list({ upcoming: true })).filter((p) => p.status === 'PENDING')
    } else {
      const { from, to } = dateRangeKeys(range.value)
      plans.value = await managerPlans.list({
        from, to, agentId: agent.value ? Number(agent.value) : null, schoolId: school.value ? Number(school.value) : null,
        source: (source.value as Plan['source'] | null),
      })
      if (status.value) plans.value = plans.value.filter((p) => p.status === status.value)
    }
  } finally {
    loading.value = false
  }
}
onMounted(load)
watch(tab, () => { page.value = 1; void load() })
watch([range, agent, school, status, source], () => { page.value = 1; if (tab.value === 'all') void load() })

function switchTab(t: Tab) { if (tab.value !== t) tab.value = t }
function openDecision(p: Plan) { decisionPlanId.value = p.id; decisionOpen.value = true }
async function afterDecision() { await Promise.all([load(), refreshPendingPlanCount()]) }
</script>

<template>
  <div class="jadwal">
    <div class="jadwal__tabs">
      <div class="tabs" role="tablist">
        <button type="button" class="tabs__item" :class="{ 'tabs__item--on': tab === 'pending' }" role="tab" :aria-selected="tab === 'pending'" @click="switchTab('pending')">Menunggu persetujuan</button>
        <button type="button" class="tabs__item" :class="{ 'tabs__item--on': tab === 'all' }" role="tab" :aria-selected="tab === 'all'" @click="switchTab('all')">Semua rencana</button>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="createOpen = true">Buat jadwal</v-btn>
    </div>

    <div v-if="tab === 'all'" class="jadwal__filters">
      <div class="jadwal__date">
        <label for="f-tanggal" class="jadwal__label">Tanggal</label>
        <v-menu v-model="dateMenu" :close-on-content-click="false">
          <template #activator="{ props: menu }">
            <button id="f-tanggal" v-bind="menu" type="button" class="jadwal__date-field" aria-label="Pilih rentang tanggal">
              <span>{{ rangeText }}</span>
              <v-icon icon="mdi-calendar-month-outline" size="20" />
            </button>
          </template>
          <v-card class="jadwal__picker">
            <v-date-picker v-model="range" multiple="range" hide-header color="primary" />
            <div class="jadwal__picker-actions">
              <v-btn variant="text" @click="range = []">Semua tanggal</v-btn>
              <v-btn @click="dateMenu = false">Terapkan</v-btn>
            </div>
          </v-card>
        </v-menu>
      </div>
      <LabeledSelect id="f-agent" v-model="agent" label="Agent" :items="agentItems" class="jadwal__f200" />
      <LabeledSelect id="f-sekolah" v-model="school" label="Sekolah" :items="schoolItems" class="jadwal__f240" />
      <LabeledSelect id="f-status" v-model="status" label="Status" :items="statusItems" class="jadwal__f180" />
      <LabeledSelect id="f-sumber" v-model="source" label="Sumber" :items="sourceItems" class="jadwal__f180" />
    </div>

    <v-card class="jadwal__table">
      <v-data-table :headers="headers" :items="plans" v-model:page="page" :items-per-page="perPage" :loading="loading" hide-default-footer>
        <template #item.planDate="{ item }">{{ formatDay(item.planDate) }}</template>
        <template #item.source="{ item }"><StatusChip :label="sourceChip(item.source).label" :tone="sourceChip(item.source).tone" /></template>
        <template #item.status="{ item }"><StatusChip :label="planStatusChip(item.status).label" :tone="planStatusChip(item.status).tone" /></template>
        <template #item.action="{ item }">
          <v-btn v-if="item.status === 'PENDING'" size="small" color="primary" @click="openDecision(item)">Putuskan</v-btn>
          <v-btn v-else variant="text" size="small" @click="openDecision(item)">Detail</v-btn>
        </template>
        <template #no-data>
          <EmptyState
            :title="tab === 'pending' ? 'Tidak ada pengajuan menunggu' : 'Rencana tidak ditemukan'"
            :description="tab === 'pending' ? 'Semua pengajuan kunjungan sudah diputuskan.' : 'Coba ubah rentang tanggal atau filter agent, sekolah, status, dan sumber.'"
            icon="mdi-calendar-check-outline"
          />
        </template>
        <template #bottom>
          <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="plans.length" />
        </template>
      </v-data-table>
    </v-card>

    <BuatJadwalDialog v-model="createOpen" @created="load" />
    <PlanDecisionDialog v-model="decisionOpen" :plan-id="decisionPlanId" @decided="afterDecision" />
  </div>
</template>

<style scoped>
.jadwal { display: flex; flex-direction: column; gap: 24px; }
.jadwal__tabs { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgb(var(--v-theme-canvas-alt)); }
.tabs__item { min-height: 32px; padding: 7px 16px; border-radius: 999px; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.tabs__item--on { background: rgb(var(--v-theme-surface)); border: 1px solid rgb(var(--v-theme-border)); font-weight: 600; color: rgb(var(--v-theme-secondary)); }
.jadwal__filters { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.jadwal__f200 { width: 200px; }
.jadwal__f240 { width: 240px; }
.jadwal__f180 { width: 180px; }
.jadwal__date { width: 220px; display: flex; flex-direction: column; gap: 6px; }
.jadwal__label { font-size: 13px; line-height: 18px; font-weight: 500; }
.jadwal__date-field {
  display: flex; align-items: center; justify-content: space-between; height: 42px; padding: 0 12px; border-radius: 5px;
  border: 1px solid rgb(var(--v-theme-border)); background: rgb(var(--v-theme-surface)); font-size: 14px; text-align: left;
}
.jadwal__picker { padding: 8px; }
.jadwal__picker-actions { display: flex; justify-content: space-between; padding: 8px; }
.jadwal__table { overflow: hidden; }
.jadwal :deep(.table-footer) { border-top: 1px solid rgb(var(--v-theme-border)); }
.jadwal :deep(.v-table > .v-table__wrapper > table > thead > tr > th) { height: 47px; font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.jadwal :deep(.v-table > .v-table__wrapper > table > tbody > tr > td) { height: 56px; }
</style>
