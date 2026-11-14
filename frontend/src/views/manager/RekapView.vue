<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusChip from '@/components/StatusChip.vue'
import { dateRangeKeys, dateRangeLabel } from '@/components/manager/date-range'
import { listAgentOptions, listSchoolOptions, listVisits, type VisitRow } from '@/services/manager'
import { formatDuration } from '@/utils/format'
import { formatClock } from '@/utils/timezone'

// Manager – Rekap kunjungan (Figma 20:220). Tanggal dan hari menurut WIB, jam dalam zona agent.
const router = useRouter()
const headers = [
  { title: 'Tanggal', key: 'dateLabel', sortable: false, width: 120 },
  { title: 'Hari', key: 'dayLabel', sortable: false, width: 90 },
  { title: 'Agent', key: 'agentName', sortable: false, width: 160 },
  { title: 'Sekolah', key: 'schoolName', sortable: false },
  { title: 'Check-in', key: 'checkIn', sortable: false, width: 116 },
  { title: 'Check-out', key: 'checkOut', sortable: false, width: 116 },
  { title: 'Durasi', key: 'duration', sortable: false, width: 96 },
  { title: 'Status', key: 'status', sortable: false, width: 140 },
  { title: '​', key: 'go', sortable: false, width: 56 },
]
const agentItems = [{ title: 'Semua agent', value: null }, ...listAgentOptions().map((a) => ({ title: a.name, value: String(a.id) }))]
const schoolItems = [{ title: 'Semua sekolah', value: null }, ...listSchoolOptions().map((s) => ({ title: s.name, value: String(s.id) }))]
const statusItems = [
  { title: 'Semua status', value: null }, { title: 'Berlangsung', value: 'ONGOING' }, { title: 'Selesai', value: 'COMPLETED' },
]

const items = ref<VisitRow[]>([])
const range = ref<Date[]>([new Date(2026, 10, 1), new Date(2026, 10, 14)])
const dateMenu = ref(false)
const agent = ref<string | null>(null)
const school = ref<string | null>(null)
const status = ref<string | null>(null)
const page = ref(1)
const perPage = ref(10)

const rangeText = computed(() => dateRangeLabel(range.value))
const done = computed(() => items.value.filter((r) => r.status === 'COMPLETED').length)
const ongoing = computed(() => items.value.length - done.value)

async function load() {
  const { from, to } = dateRangeKeys(range.value)
  items.value = await listVisits({
    from, to, agentId: agent.value ? Number(agent.value) : null, schoolId: school.value ? Number(school.value) : null,
    status: status.value as 'ONGOING' | 'COMPLETED' | null,
  })
}
onMounted(load)
watch([range, agent, school, status], () => { page.value = 1; load() })

const open = (id: number) => router.push({ name: 'rekap-detail', params: { id } })
function rowProps({ item }: { item: VisitRow }) {
  return {
    'data-testid': 'rekap-row', class: 'rekap__row', tabindex: 0, role: 'link', 'aria-label': `Buka detail kunjungan ${item.schoolName}, ${item.dateLabel}`,
    onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter') open(item.id) },
  }
}
function pick(_: Event, { item }: { item: VisitRow }) { open(item.id) }
</script>

<template>
  <div class="rekap">
    <div class="rekap__filters">
      <div class="rekap__date">
        <label for="f-tanggal" class="rekap__label">Tanggal</label>
        <v-menu v-model="dateMenu" :close-on-content-click="false">
          <template #activator="{ props: menu }">
            <button id="f-tanggal" v-bind="menu" type="button" class="rekap__date-field" aria-label="Pilih rentang tanggal">
              <span>{{ rangeText }}</span>
              <v-icon icon="mdi-calendar-month-outline" size="20" />
            </button>
          </template>
          <v-card class="rekap__picker">
            <v-date-picker v-model="range" multiple="range" hide-header color="primary" />
            <div class="rekap__picker-actions">
              <v-btn variant="text" @click="range = []">Semua tanggal</v-btn>
              <v-btn @click="dateMenu = false">Terapkan</v-btn>
            </div>
          </v-card>
        </v-menu>
      </div>
      <LabeledSelect id="f-agent" v-model="agent" label="Agent" :items="agentItems" class="rekap__f200" />
      <LabeledSelect id="f-sekolah" v-model="school" label="Sekolah" :items="schoolItems" class="rekap__f240" />
      <LabeledSelect id="f-status" v-model="status" label="Status" :items="statusItems" class="rekap__f180" />
      <v-spacer />
      <v-btn variant="outlined" prepend-icon="mdi-download" aria-label="Ekspor CSV">Ekspor CSV</v-btn>
    </div>

    <div class="rekap__summary">
      <span class="rekap__count">{{ items.length }} kunjungan</span>
      <StatusChip :label="`${done} selesai`" tone="success" />
      <StatusChip :label="`${ongoing} berlangsung`" tone="info" />
      <v-spacer />
      <span class="rekap__note">Tanggal dan hari mengikuti WIB. Jam ditampilkan dalam zona agent.</span>
    </div>

    <v-card class="rekap__table">
      <v-data-table :headers="headers" :items="items" v-model:page="page" :items-per-page="perPage" hide-default-footer :row-props="rowProps" @click:row="pick">
        <template #item.checkIn="{ item }">{{ formatClock(item.checkInAt, item.timezone) }}</template>
        <template #item.checkOut="{ item }">{{ item.checkOutAt ? formatClock(item.checkOutAt, item.timezone) : '–' }}</template>
        <template #item.duration="{ item }">{{ formatDuration(item.durationMinutes) }}</template>
        <template #item.status="{ item }">
          <StatusChip :label="item.status === 'ONGOING' ? 'Berlangsung' : 'Selesai'" :tone="item.status === 'ONGOING' ? 'info' : 'success'" />
        </template>
        <template #item.go><v-icon icon="mdi-chevron-right" size="20" class="rekap__go" /></template>
        <template #no-data><EmptyState title="Kunjungan tidak ditemukan" description="Coba ubah rentang tanggal atau filter agent, sekolah, dan status." icon="mdi-clipboard-search-outline" /></template>
        <template #bottom>
          <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="items.length" />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.rekap { display: flex; flex-direction: column; gap: 24px; }
.rekap__filters { display: flex; align-items: flex-end; gap: 16px; }
.rekap__f200 { width: 200px; }
.rekap__f240 { width: 240px; }
.rekap__f180 { width: 180px; }
.rekap__date { width: 220px; display: flex; flex-direction: column; gap: 6px; }
.rekap__label { font-size: 13px; line-height: 18px; font-weight: 500; }
.rekap__date-field {
  display: flex; align-items: center; justify-content: space-between; height: 42px; padding: 0 12px; border-radius: 5px;
  border: 1px solid rgb(var(--v-theme-border)); background: rgb(var(--v-theme-surface)); font-size: 14px; text-align: left;
}
.rekap__picker { padding: 8px; }
.rekap__picker-actions { display: flex; justify-content: space-between; padding: 8px; }
.rekap__summary { display: flex; align-items: center; gap: 8px; }
.rekap__count { font-size: 14px; line-height: 20px; font-weight: 500; margin-right: 4px; }
.rekap__note { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.rekap__table { overflow: hidden; }
.rekap__go { color: rgb(var(--v-theme-text-secondary)); }
.rekap :deep(.table-footer) { border-top: 1px solid rgb(var(--v-theme-border)); }
.rekap :deep(.rekap__row) { cursor: pointer; }
.rekap :deep(.rekap__row:focus-visible) { outline: 2px solid rgb(var(--v-theme-primary)); outline-offset: -2px; }
.rekap :deep(.v-table > .v-table__wrapper > table > thead > tr > th) { height: 47px; font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.rekap :deep(.v-table > .v-table__wrapper > table > tbody > tr > td) { height: 52px; }
</style>
