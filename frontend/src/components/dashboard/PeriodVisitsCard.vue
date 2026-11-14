<script setup lang="ts">
import { ref, watch } from 'vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import StatusChip from '@/components/StatusChip.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { VisitRow } from '@/services/manager'
import { formatDuration } from '@/utils/format'
import { formatClock } from '@/utils/timezone'

// Daftar kunjungan pada periode terpilih, terbaru di atas. Jam di zona agent, tanggal menurut WIB.
const props = defineProps<{ rows: VisitRow[] }>()
const page = ref(1)
const perPage = ref(10)
watch(() => props.rows, () => (page.value = 1))

const headers = [
  { title: 'Tanggal', key: 'date', sortable: false },
  { title: 'Agent', key: 'agentName', sortable: false },
  { title: 'Sekolah', key: 'schoolName', sortable: false },
  { title: 'Check-in', key: 'checkIn', sortable: false },
  { title: 'Check-out', key: 'checkOut', sortable: false },
  { title: 'Durasi', key: 'duration', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
]
const short = (key: string) => new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(`${key}T05:00:00Z`))
</script>

<template>
  <v-card class="vis">
    <header class="vis__head">
      <div>
        <h2 class="vis__title">Kunjungan periode ini</h2>
        <p class="vis__sub">Terbaru di atas</p>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-open-in-new" to="/rekap">Buka rekap kunjungan</v-btn>
    </header>
    <div class="vis__table">
      <v-data-table :headers="headers" :items="rows" :page="page" :items-per-page="perPage" hide-default-footer data-testid="period-visits">
        <template #item.date="{ item }">{{ short(item.dateKey) }}</template>
        <template #item.checkIn="{ item }">{{ formatClock(item.checkInAt, item.timezone) }}</template>
        <template #item.checkOut="{ item }">{{ item.checkOutAt ? formatClock(item.checkOutAt, item.timezone) : '–' }}</template>
        <template #item.duration="{ item }">{{ formatDuration(item.durationMinutes) }}</template>
        <template #item.status="{ item }"><StatusChip :label="item.status === 'ONGOING' ? 'Berlangsung' : 'Selesai'" :tone="item.status === 'ONGOING' ? 'info' : 'success'" /></template>
        <template #no-data><EmptyState title="Belum ada kunjungan" description="Kunjungan pada periode ini akan muncul di sini setelah agent melakukan check-in." /></template>
        <template #bottom><DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="rows.length" /></template>
      </v-data-table>
    </div>
  </v-card>
</template>

<style scoped>
.vis { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.vis__head { display: flex; align-items: flex-start; justify-content: space-between; }
.vis__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.vis__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.vis__table { border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
</style>
