<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import StatusChip from '@/components/StatusChip.vue'
import { agentPlans, isCheckInableToday, planStatusChip, sourceChip, type Plan } from '@/services/agent-plans'
import { formatDateLong } from '@/utils/format'
import { wibDateKey } from '@/utils/timezone'

const router = useRouter()
type Tab = 'upcoming' | 'history'
const tab = ref<Tab>('upcoming')
const plans = ref<Plan[]>([])
const loading = ref(true)
const cancelling = ref<number | null>(null)
const today = wibDateKey(new Date())

async function load() {
  loading.value = true
  try { plans.value = await agentPlans.list(tab.value === 'upcoming') } finally { loading.value = false }
}
onMounted(load)
function switchTab(t: Tab) { if (tab.value !== t) { tab.value = t; void load() } }

// Kelompokkan per tanggal rencana (terbaru di atas; untuk Mendatang terdekat di atas).
const groups = computed(() => {
  const sorted = [...plans.value].sort((a, b) => (tab.value === 'upcoming' ? a.planDate.localeCompare(b.planDate) : b.planDate.localeCompare(a.planDate)))
  const out: { date: string; label: string; plans: Plan[] }[] = []
  for (const p of sorted) {
    const last = out[out.length - 1]
    if (last && last.date === p.planDate) last.plans.push(p)
    else out.push({ date: p.planDate, label: dateLabel(p.planDate), plans: [p] })
  }
  return out
})

function dateLabel(date: string): string {
  const long = formatDateLong(`${date}T12:00:00+07:00`)
  return date === today ? `Hari ini · ${long}` : long
}

// Catatan kontekstual per rencana (persetujuan, penolakan, jadwal manager, kedaluwarsa).
function note(p: Plan): { icon: string; tone: 'success' | 'warning' | 'info' | 'error' | 'muted'; text: string } | null {
  if (p.status === 'APPROVED' && p.source === 'SELF' && p.decidedBy) return { icon: 'mdi-check', tone: 'success', text: `Disetujui ${p.decidedBy}. Berlaku hanya pada tanggal rencana.` }
  if (p.status === 'APPROVED' && p.source === 'MANAGER') return { icon: 'mdi-information-outline', tone: 'info', text: 'Jadwal dari manager. Hanya manager yang bisa membatalkan.' }
  if (p.status === 'PENDING') return { icon: 'mdi-alert-circle-outline', tone: 'warning', text: 'Sekolah ini bukan tugas Anda. Belum bisa check-in sampai manager menyetujui.' }
  if (p.status === 'REJECTED' && p.decisionNote) return { icon: 'mdi-alert-circle-outline', tone: 'error', text: `Alasan manager: ${p.decisionNote}` }
  if (p.status === 'MISSED') return { icon: 'mdi-information-outline', tone: 'muted', text: 'Tidak ada check-in pada tanggal rencana.' }
  if (p.status === 'EXPIRED') return { icon: 'mdi-information-outline', tone: 'muted', text: 'Pengajuan tidak diputuskan sampai tanggal rencana.' }
  return null
}

const canCancel = (p: Plan) => (p.status === 'APPROVED' || p.status === 'PENDING') && p.source === 'SELF' && !p.visitId
async function cancel(p: Plan) {
  cancelling.value = p.id
  try { await agentPlans.cancel(p.id); await load() } finally { cancelling.value = null }
}
</script>

<template>
  <div class="rencana">
    <div class="tabs" role="tablist">
      <button type="button" class="tabs__item" :class="{ 'tabs__item--on': tab === 'upcoming' }" role="tab" :aria-selected="tab === 'upcoming'" @click="switchTab('upcoming')">Mendatang</button>
      <button type="button" class="tabs__item" :class="{ 'tabs__item--on': tab === 'history' }" role="tab" :aria-selected="tab === 'history'" @click="switchTab('history')">Riwayat</button>
    </div>

    <v-btn v-if="tab === 'upcoming'" color="primary" rounded="pill" height="44" prepend-icon="mdi-plus" block to="/agent/rencana/buat">Buat rencana</v-btn>

    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-card v-else-if="!groups.length">
      <EmptyState icon="mdi-calendar-outline" :title="tab === 'upcoming' ? 'Belum ada rencana mendatang' : 'Belum ada riwayat rencana'" :description="tab === 'upcoming' ? 'Buat rencana kunjungan atau tunggu jadwal dari manager.' : 'Rencana yang selesai, terlewat, atau ditolak akan tampil di sini.'" />
    </v-card>

    <template v-for="g in groups" :key="g.date">
      <h2 class="rencana__day">{{ g.label }}</h2>
      <v-card v-for="p in g.plans" :key="p.id" class="plan">
        <div class="plan__head">
          <p class="plan__name">{{ p.schoolName }}</p>
          <p class="plan__meta">NPSN {{ p.npsn }} · {{ p.city }}</p>
        </div>
        <p class="plan__purpose">Tujuan: {{ p.purpose }}</p>
        <div class="plan__chips">
          <StatusChip :label="planStatusChip(p.status).label" :tone="planStatusChip(p.status).tone" />
          <StatusChip :label="sourceChip(p.source).label" :tone="sourceChip(p.source).tone" />
        </div>
        <div v-if="note(p)" class="plan__note" :class="`plan__note--${note(p)!.tone}`">
          <v-icon :icon="note(p)!.icon" size="18" />
          <span>{{ note(p)!.text }}</span>
        </div>
        <v-btn v-if="isCheckInableToday(p, today) && !p.visitId" color="primary" rounded="pill" height="44" prepend-icon="mdi-map-marker-check-outline" block to="/agent/check-in">Check-in</v-btn>
        <v-btn v-if="canCancel(p)" variant="outlined" rounded="pill" height="44" block :loading="cancelling === p.id" @click="cancel(p)">Batalkan rencana</v-btn>
      </v-card>
    </template>
  </div>
</template>

<style scoped>
.rencana { display: flex; flex-direction: column; gap: 16px; }
.tabs { display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: rgb(var(--v-theme-canvas-alt)); }
.tabs__item { flex: 1; min-height: 32px; padding: 7px 16px; border-radius: 999px; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.tabs__item--on { background: rgb(var(--v-theme-surface)); border: 1px solid rgb(var(--v-theme-border)); font-weight: 600; color: rgb(var(--v-theme-secondary)); }
.rencana__day { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.plan { display: flex; flex-direction: column; gap: 8px; padding: 16px; }
.plan__head { display: flex; flex-direction: column; gap: 2px; }
.plan__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.plan__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.plan__purpose { font-size: 14px; line-height: 20px; }
.plan__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.plan__note { display: flex; gap: 8px; padding: 10px 12px; border-radius: 8px; font-size: 12px; line-height: 16px; }
.plan__note .v-icon { flex: none; margin-top: 1px; }
.plan__note--success { background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.plan__note--warning { background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); }
.plan__note--info { background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); }
.plan__note--error { background: rgb(var(--v-theme-error-surface)); color: rgb(var(--v-theme-error)); }
.plan__note--muted { background: rgb(var(--v-theme-background)); color: rgb(var(--v-theme-text-secondary)); }
</style>
