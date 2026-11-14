<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import StatusChip from '@/components/StatusChip.vue'
import DataRows from '@/components/agent/DataRows.vue'
import IconRow from '@/components/agent/IconRow.vue'
import SectionCard from '@/components/agent/SectionCard.vue'
import { contractRetention, contractStateChip, focusContract, formatContractDate, formatPeriod, renewalStatus, signedRenewalOf } from '@/components/agent/contracts'
import { formatVisitClockRange, formatVisitDay, visitMinutes } from '@/components/agent/visit-format'
import { agentService } from '@/services/agent'
import { useAgentVisitsStore } from '@/stores/agent-visits'
import { formatDateShort, formatDuration, formatPercent, formatRupiah } from '@/utils/format'
import { wibDateKey } from '@/utils/timezone'

const route = useRoute()
const store = useAgentVisitsStore()
const school = computed(() => agentService.schoolDetail(Number(route.params.id)))
const today = computed(() => wibDateKey(store.now))
const contracts = computed(() => school.value?.contracts ?? [])
const focus = computed(() => focusContract(contracts.value, today.value))
const status = computed(() => renewalStatus(contracts.value, today.value))

const running = computed(() => {
  const c = focus.value
  if (!c) return []
  const renewal = signedRenewalOf(c, contracts.value)
  return [
    ['Periode', formatPeriod(c.startDate, c.endDate)],
    ['Nilai kontrak', formatRupiah(c.value)],
    ['Perpanjangan', renewal ? `${formatRupiah(renewal.value)} · ditandatangani ${formatContractDate(renewal.signedDate!)}` : 'Belum ada perpanjangan'],
    ['Retention', formatPercent(contractRetention(c, contracts.value))],
  ] as [string, string][]
})
const history = computed(() =>
  contracts.value.map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: `${formatPeriod(c.startDate, c.endDate)} · ${formatRupiah(c.value)}`,
    state: contractStateChip(c, today.value),
    retention: signedRenewalOf(c, contracts.value) ? `Retention ${formatPercent(contractRetention(c, contracts.value))}` : null,
  })),
)
const dataRows = computed<[string, string][]>(() => {
  const s = school.value
  if (!s) return []
  const rows: [string, string][] = [['ID LMS Skolla', s.lmsId ?? '–'], ['Kota', s.city], ['Alamat', s.address], ['PIC', s.pic], ['Kontak PIC', s.picPhone]]
  rows.push(['Mulai kerja sama', formatContractDate(s.startedAt)], ['Onboarding', formatContractDate(s.onboardingAt)], ['Aktif menggunakan', formatContractDate(s.activeAt)], ['Berakhir', formatContractDate(s.endsAt)])
  return rows
})
const reports = computed(() =>
  store.sorted
    .filter((v) => v.schoolId === school.value?.id)
    .slice(0, 2)
    .map((v) => ({
      id: v.id,
      day: formatDateShort(v.checkInAt),
      meta: `${formatVisitClockRange(v)} · ${v.status === 'ONGOING' ? 'berlangsung' : formatDuration(visitMinutes(v, store.now))}`,
      text: v.report,
    })),
)

const tabs = [['Ringkasan', 'ringkasan'], ['Kontrak', 'kontrak'], ['Kunjungan', 'kunjungan']] as const
function jump(anchor: string) {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <v-card v-if="!school"><EmptyState icon="mdi-school-outline" title="Sekolah tidak ditemukan" description="Sekolah ini tidak ada dalam daftar Anda." /></v-card>
  <div v-else class="detail">
    <div id="ringkasan">
      <h2 class="detail__name">{{ school.name }}</h2>
      <p class="caption">NPSN {{ school.npsn }} · {{ school.level }} · Paket {{ school.packageName }} · {{ school.timezone }}</p>
    </div>
    <div class="tabs" role="tablist" aria-label="Bagian detail sekolah">
      <button v-for="([label, anchor], i) in tabs" :key="anchor" type="button" role="tab" class="tabs__item" :class="{ 'tabs__item--on': i === 0 }" :aria-selected="i === 0" @click="jump(anchor)">{{ label }}</button>
    </div>

    <template v-if="school.assigned">
      <SectionCard id="kontrak" :title="focus && focus.startDate <= today ? 'Kontrak berjalan' : 'Kontrak terakhir'">
        <template v-if="status" #action><StatusChip :label="status.label" :tone="status.tone" /></template>
        <DataRows :rows="running" />
      </SectionCard>
      <SectionCard title="Riwayat kontrak">
        <div>
          <IconRow v-for="(h, i) in history" :key="h.id" :title="h.title" :subtitle="h.subtitle" icon="mdi-file-document-outline" :last="i === history.length - 1">
            <div class="chips"><StatusChip :label="h.state.label" :tone="h.state.tone" /><StatusChip v-if="h.retention" :label="h.retention" /></div>
          </IconRow>
        </div>
      </SectionCard>
    </template>
    <v-card v-else id="kontrak" class="notice">
      <v-icon icon="mdi-lock-outline" size="20" />
      <p>Nilai kontrak dan retention hanya tampil untuk sekolah yang ditugaskan kepada Anda.</p>
    </v-card>

    <SectionCard title="Data sekolah"><DataRows :rows="dataRows" /></SectionCard>

    <SectionCard id="kunjungan" title="Laporan kunjungan Anda">
      <template #action><router-link to="/agent/riwayat" class="link">Lihat semua</router-link></template>
      <p v-if="!reports.length" class="body-secondary">Belum ada kunjungan ke sekolah ini.</p>
      <div v-for="(r, i) in reports" :key="r.id" class="report" :class="{ 'report--last': i === reports.length - 1 }">
        <p class="report__day">{{ r.day }}</p>
        <p class="caption">{{ r.meta }}</p>
        <p :class="r.text ? 'report__text' : 'body-secondary'">{{ r.text ?? 'Belum ada laporan' }}</p>
      </div>
    </SectionCard>
  </div>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 16px; }
.detail__name { font-size: 20px; line-height: 28px; font-weight: 600; }
.caption { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.tabs { display: flex; border-bottom: 1px solid rgb(var(--v-theme-border)); }
.tabs__item { flex: 1; min-height: 44px; padding: 10px 12px; border-bottom: 2px solid transparent; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.tabs__item--on { border-bottom-color: rgb(var(--v-theme-primary)); font-weight: 600; color: rgb(var(--v-theme-secondary)); }
.chips { display: flex; gap: 6px; }
.notice { display: flex; align-items: flex-start; gap: 10px; padding: 16px; font-size: 14px; line-height: 20px; color: rgb(var(--v-theme-text-secondary)); }
.link { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-primary)); text-decoration: none; }
.report { display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); }
.report--last { border-bottom: 0; }
.report__day { font-size: 14px; line-height: 20px; font-weight: 500; }
.report__text, .body-secondary { font-size: 14px; line-height: 20px; }
.body-secondary { color: rgb(var(--v-theme-text-secondary)); }
</style>
