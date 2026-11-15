<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ChangeChip from '@/components/ChangeChip.vue'
import StatusChip from '@/components/StatusChip.vue'
import IconRow from '@/components/agent/IconRow.vue'
import PeriodPicker from '@/components/agent/PeriodPicker.vue'
import SectionCard from '@/components/agent/SectionCard.vue'
import { formatVisitMeta, visitMinutes } from '@/components/agent/visit-format'
import type { PeriodKey } from '@/mocks/agent'
import { agentService } from '@/services/agent'
import { agentPlans, planStatusChip, sourceChip, type Plan } from '@/services/agent-plans'
import { useAgentVisitsStore } from '@/stores/agent-visits'
import { formatDateLong, formatDuration, formatPercent, formatRupiahCompact } from '@/utils/format'
import { formatClock, wibDateKey } from '@/utils/timezone'

const router = useRouter()
const store = useAgentVisitsStore()
const profile = agentService.profile()
const retention = agentService.retention()
const period = ref<PeriodKey>('week')
const summary = computed(() => agentService.periodSummary(period.value))
const firstName = profile.name.split(' ')[0]
const barPercent = computed(() => Math.min(100, retention.percent))

const statusLabel = { 'on-target': 'Sesuai target', 'below-target': 'Di bawah target', 'no-data': 'Belum ada data' }
const statusTone = { 'on-target': 'success', 'below-target': 'error', 'no-data': 'neutral' } as const
const statusNote = computed(() => {
  const op = retention.decidedPercent >= retention.targetPercent ? '≥' : '<'
  return `Status dihitung dari kontrak yang sudah diputuskan: ${formatPercent(retention.decidedPercent)} ${op} ${retention.targetPercent}%.`
})

function delta(value: number, previous: number, format: (n: number) => string) {
  const diff = value - previous
  if (diff === 0) return undefined
  return { direction: diff > 0 ? ('up' as const) : ('down' as const), label: `${diff > 0 ? '+' : '−'}${format(Math.abs(diff))}` }
}
const cards = computed(() => {
  const s = summary.value
  return [
    { label: 'Kunjungan selesai', value: String(s.completed.value), change: delta(s.completed.value, s.completed.previous, String), vs: `vs ${s.completed.previous}` },
    { label: 'Sekolah dikunjungi', value: String(s.schools.value), change: delta(s.schools.value, s.schools.previous, String), vs: `vs ${s.schools.previous}` },
    { label: 'Rata-rata durasi', value: formatDuration(s.avgDurationMinutes.value), change: delta(s.avgDurationMinutes.value, s.avgDurationMinutes.previous, formatDuration), vs: `vs ${formatDuration(s.avgDurationMinutes.previous)}` },
  ]
})
const unvisitedList = computed(() => agentService.unvisitedSchools(period.value))
const periodNoun = computed(() => ({ day: 'hari ini', week: 'minggu ini', month: 'bulan ini' })[period.value])
const total = computed(() => summary.value.assignedVisits + summary.value.otherVisits)
const assignedWidth = computed(() => (total.value ? (summary.value.assignedVisits / total.value) * 100 : 0))
const ongoingText = computed(() => {
  const v = store.ongoing
  if (!v) return ''
  return `Check-in ${formatClock(v.checkInAt, v.timezone)} · berjalan ${formatDuration(visitMinutes(v, store.now))}`
})

// Rencana hari ini (Terjadwal pada tanggal WIB hari ini): jadwal dari manager dan rencana sendiri.
const todayPlans = ref<Plan[]>([])
onMounted(async () => {
  const today = wibDateKey(store.now)
  const upcoming = await agentPlans.list(true)
  todayPlans.value = upcoming.filter((p) => p.planDate === today && p.status === 'APPROVED')
})
</script>

<template>
  <div class="beranda">
    <div>
      <h2 class="beranda__hello">Halo, {{ firstName }}</h2>
      <p class="beranda__date">{{ formatDateLong(store.now) }} · zona {{ profile.timezone }}</p>
    </div>

    <section v-if="store.ongoing" class="ongoing" aria-label="Kunjungan berlangsung">
      <div class="ongoing__label"><v-icon icon="mdi-timer-outline" size="20" />Kunjungan berlangsung</div>
      <p class="ongoing__school">{{ store.ongoing.schoolName }}</p>
      <p class="ongoing__meta">{{ ongoingText }}</p>
      <button type="button" class="ongoing__btn" @click="router.push('/agent/check-out')">
        <v-icon icon="mdi-logout" size="20" />Check-out dan tulis laporan
      </button>
    </section>
    <v-card v-else class="idle">
      <p class="idle__title">Belum ada kunjungan berlangsung</p>
      <p class="idle__text">Mulai kunjungan dengan memilih sekolah, foto, dan lokasi.</p>
      <v-btn color="primary" rounded="pill" height="44" prepend-icon="mdi-map-marker-check-outline" to="/agent/check-in">Check-in</v-btn>
    </v-card>

    <SectionCard v-if="todayPlans.length" title="Rencana hari ini" :subtitle="formatDateLong(store.now)">
      <template #action><StatusChip :label="String(todayPlans.length)" tone="info" /></template>
      <router-link v-for="p in todayPlans" :key="p.id" to="/agent/rencana" class="plan-row">
        <span class="plan-row__icon"><v-icon icon="mdi-calendar-outline" size="20" /></span>
        <span class="plan-row__body">
          <span class="plan-row__name">{{ p.schoolName }}</span>
          <span class="plan-row__meta">{{ sourceChip(p.source).label }} · {{ p.purpose }}</span>
        </span>
        <StatusChip :label="planStatusChip(p.status).label" :tone="planStatusChip(p.status).tone" />
      </router-link>
      <router-link to="/agent/rencana" class="plan-row__link">Lihat semua rencana</router-link>
    </SectionCard>

    <PeriodPicker v-model="period" :label="summary.label" />

    <SectionCard :title="`Retention ${retention.year}`" subtitle="Sekolah yang ditugaskan kepada Anda">
      <template #action><StatusChip :label="statusLabel[retention.status]" :tone="statusTone[retention.status]" /></template>
      <div class="retention__figure">
        <span class="retention__value">{{ formatPercent(retention.percent) }}</span>
        <span class="retention__target">target {{ retention.targetPercent }}%</span>
      </div>
      <div class="progress" role="progressbar" :aria-valuenow="retention.percent" aria-valuemin="0" aria-valuemax="100" :aria-label="`Retention ${retention.year}`">
        <div class="progress__fill" :style="{ width: `${barPercent}%` }" />
        <div class="progress__mark" :style="{ left: `${retention.targetPercent}%` }" />
      </div>
      <div class="retention__row">
        <div><p class="retention__amount">{{ formatRupiahCompact(retention.signedValue) }}</p><p class="caption">ditandatangani</p></div>
        <div class="retention__right"><p class="retention__amount">{{ formatRupiahCompact(retention.cohortValue) }}</p><p class="caption">kontrak berakhir {{ retention.year }}</p></div>
      </div>
      <p class="caption">{{ statusNote }}</p>
    </SectionCard>

    <div class="grid">
      <v-card v-for="c in cards" :key="c.label" class="mini">
        <p class="caption">{{ c.label }}</p>
        <p class="mini__value">{{ c.value }}</p>
        <div class="mini__change">
          <ChangeChip v-if="c.change" :direction="c.change.direction" :label="c.change.label" />
          <span class="caption">{{ c.vs }}</span>
        </div>
      </v-card>
      <v-card class="mini">
        <p class="caption">Perpanjangan ditandatangani</p>
        <p class="mini__value">{{ summary.renewalValue === null ? '–' : formatRupiahCompact(summary.renewalValue) }}</p>
        <p class="caption">{{ summary.renewalPreviousLabel }}</p>
      </v-card>
    </div>

    <SectionCard title="Ke mana Anda berkunjung" :subtitle="`${summary.completed.value} kunjungan selesai ${periodNoun}`">
      <div class="split" role="img" :aria-label="`Ditugaskan ${summary.assignedVisits}, sekolah lain ${summary.otherVisits}`">
        <div class="split__a" :style="{ width: `${assignedWidth}%` }" />
        <div class="split__b" :style="{ width: `${100 - assignedWidth}%` }" />
      </div>
      <div class="legend">
        <span class="legend__item"><i class="legend__dot legend__dot--a" />Ditugaskan: {{ summary.assignedVisits }}</span>
        <span class="legend__item"><i class="legend__dot legend__dot--b" />Sekolah lain: {{ summary.otherVisits }}</span>
      </div>
    </SectionCard>

    <SectionCard :title="`Belum dikunjungi ${periodNoun}`" subtitle="Sekolah yang ditugaskan kepada Anda">
      <template #action><StatusChip :label="String(unvisitedList.length)" tone="warning" /></template>
      <div>
        <IconRow v-for="(s, i) in unvisitedList" :key="s.schoolId" :title="s.name" :subtitle="s.lastVisit === 'belum pernah' ? 'Belum pernah dikunjungi' : `Terakhir dikunjungi ${s.lastVisit}`" icon="mdi-school-outline" :to="`/agent/sekolah/${s.schoolId}`" :last="i === unvisitedList.length - 1" />
      </div>
    </SectionCard>

    <SectionCard title="Kontrak perlu perhatian" :subtitle="`Tahun ${retention.year}`">
      <div>
        <IconRow v-for="(c, i) in agentService.attentionContracts()" :key="c.schoolId" :title="c.name" :subtitle="`${c.endLabel} · ${c.valueLabel}`" icon="mdi-file-document-outline" :tone="c.tone" :to="`/agent/sekolah/${c.schoolId}`" :last="i === agentService.attentionContracts().length - 1">
          <div class="chip-gap"><StatusChip :label="c.chip" :tone="c.tone" /></div>
        </IconRow>
      </div>
    </SectionCard>

    <SectionCard title="Kunjungan minggu ini">
      <template #action><router-link to="/agent/riwayat" class="link">Lihat semua</router-link></template>
      <div>
        <IconRow v-for="(v, i) in store.sorted.slice(0, 3)" :key="v.id" :title="v.schoolName" :subtitle="formatVisitMeta(v, store.now)" :last="i === Math.min(3, store.sorted.length) - 1">
          <template #end><StatusChip :label="v.status === 'ONGOING' ? 'Berlangsung' : 'Selesai'" :tone="v.status === 'ONGOING' ? 'info' : 'success'" /></template>
        </IconRow>
      </div>
    </SectionCard>
  </div>
</template>

<style scoped>
.beranda { display: flex; flex-direction: column; gap: 16px; }
.beranda__hello { font-size: 20px; line-height: 28px; font-weight: 600; }
.beranda__date, .caption { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.plan-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); color: inherit; text-decoration: none; }
.plan-row__icon { display: flex; align-items: center; justify-content: center; flex: none; width: 36px; height: 36px; border-radius: 8px; background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.plan-row__body { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.plan-row__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.plan-row__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.plan-row__link { display: inline-block; padding-top: 4px; font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-secondary)); text-decoration: none; }
.ongoing { display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 8px; background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); }
.ongoing__label { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 18px; font-weight: 500; }
.ongoing__school { font-size: 16px; line-height: 24px; font-weight: 600; }
.ongoing__meta { font-size: 14px; line-height: 20px; }
.ongoing__btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 44px; border-radius: 999px; background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-primary)); font-size: 14px; line-height: 20px; font-weight: 600; }
.idle { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px; }
.idle__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.idle__text { font-size: 14px; line-height: 20px; color: rgb(var(--v-theme-text-secondary)); }
.retention__figure { display: flex; align-items: flex-end; gap: 8px; }
.retention__value { font-size: 24px; line-height: 32px; font-weight: 600; }
.retention__target { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.progress { position: relative; height: 8px; border-radius: 4px; background: rgb(var(--v-theme-canvas-alt)); }
.progress__fill { height: 8px; border-radius: 4px; background: rgb(var(--v-theme-success-solid)); }
.progress__mark { position: absolute; top: -4px; width: 2px; height: 16px; background: rgb(var(--v-theme-on-surface)); }
.retention__row { display: flex; justify-content: space-between; }
.retention__right { text-align: right; }
.retention__amount { font-size: 14px; line-height: 20px; font-weight: 500; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.mini { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; padding: 14px; }
.mini__value { font-size: 20px; line-height: 28px; font-weight: 600; white-space: nowrap; }
.mini__change { display: flex; align-items: center; gap: 4px; }
.split { display: flex; height: 10px; overflow: hidden; border-radius: 4px; }
.split__a { background: rgb(var(--v-theme-chart-1)); }
.split__b { background: rgb(var(--v-theme-chart-3)); }
.legend { display: flex; gap: 16px; }
.legend__item { display: flex; align-items: center; gap: 6px; font-size: 12px; line-height: 16px; }
.legend__dot { width: 10px; height: 10px; border-radius: 999px; }
.legend__dot--a { background: rgb(var(--v-theme-chart-1)); }
.legend__dot--b { background: rgb(var(--v-theme-chart-3)); }
.chip-gap { margin-top: 2px; }
.link { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-primary)); text-decoration: none; }
</style>
