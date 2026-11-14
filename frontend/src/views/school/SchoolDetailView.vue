<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusChip, { type ChipTone } from '@/components/StatusChip.vue'
import ContractHistory from '@/components/school/ContractHistory.vue'
import MoveDialog from '@/components/school/MoveDialog.vue'
import RenewalDialog from '@/components/school/RenewalDialog.vue'
import SchoolCard from '@/components/school/SchoolCard.vue'
import SchoolTabs from '@/components/school/SchoolTabs.vue'
import { renewalOf } from '@/components/school/contract-rules'
import { detailStatusLabel, formatDateTimeWib, formatDay, formatPeriod, initials, listStatusLabel } from '@/components/school/school-format'
import type { ChangeAction } from '@/mocks/school'
import { addRenewal, assignSchool, getSchool, listAgents, type RenewalSave, type SchoolDetail } from '@/services/school'
import { formatDuration, formatRupiah } from '@/utils/format'

// Halaman sekolah (Figma 22:669 Ringkasan dan 22:933 Riwayat perubahan). Nilai kontrak untuk admin dan manager.
const route = useRoute()
const tabs = [
  { value: 'ringkasan', label: 'Ringkasan' }, { value: 'kontrak', label: 'Kontrak' },
  { value: 'kunjungan', label: 'Kunjungan' }, { value: 'riwayat', label: 'Riwayat perubahan' },
]
const detail = ref<SchoolDetail | null>(null)
const loaded = ref(false)
const tab = ref(tabs.some((t) => t.value === route.query.tab) ? String(route.query.tab) : 'ringkasan')
const renewalOpen = ref(false)
const moveOpen = ref(false)
const snack = ref({ show: false, text: '' })
const page = ref(1)
const perPage = ref(10)

const id = computed(() => Number(route.params.id))
async function load() {
  detail.value = await getSchool(id.value)
  loaded.value = true
}
onMounted(load)
watch(id, load)

const school = computed(() => detail.value?.row.school)
const current = computed(() => detail.value?.row.contract)
const base = computed(() => {
  const latest = detail.value?.contracts[0]
  return latest && !renewalOf(latest, detail.value!.contracts) ? latest : undefined
})
const headStatus = computed(() => listStatusLabel(detail.value?.row.status ?? null))
const cardStatus = computed(() => detailStatusLabel(detail.value?.row.status ?? null))
const assignedSince = computed(() => detail.value?.assignment?.assignedAt ?? '')
const agent = computed(() => detail.value?.row.agent ?? null)

const actionTone: Record<ChangeAction, ChipTone> = { 'Check-out': 'info', 'Check-in': 'info', Ubah: 'warning', Tambah: 'success', Impor: 'brand' }
const changeHeaders = [
  { title: 'Waktu', key: 'at', sortable: false, width: 170 },
  { title: 'Pelaku', key: 'actor', sortable: false, width: 190 },
  { title: 'Aksi', key: 'action', sortable: false, width: 130 },
  { title: 'Data', key: 'data', sortable: false, width: 200 },
  { title: 'Sebelum → sesudah', key: 'change', sortable: false },
]

async function onRenewal(input: RenewalSave) {
  if (!base.value) return
  await addRenewal(id.value, base.value.id, input)
  await load()
  snack.value = { show: true, text: 'Perpanjangan tersimpan dan tercatat di riwayat perubahan' }
}
async function onMove(input: { schoolId: number; agentId: number }) {
  await assignSchool(input.schoolId, input.agentId)
  await load()
  snack.value = { show: true, text: 'Penugasan diperbarui' }
}
const showSoon = () => { snack.value = { show: true, text: 'Ubah data sekolah belum termasuk dalam layar ini' } }
</script>

<template>
  <div v-if="detail && school" class="sekolah">
    <nav class="sekolah__crumb" aria-label="Jejak halaman">
      <router-link to="/sekolah">Sekolah</router-link>
      <v-icon icon="mdi-chevron-right" size="16" />
      <span>{{ school.name }}</span>
    </nav>

    <header class="sekolah__head">
      <span class="sekolah__icon"><v-icon icon="mdi-school-outline" size="26" /></span>
      <div class="sekolah__title">
        <h1>{{ school.name }}</h1>
        <p class="sekolah__meta">
          NPSN {{ school.npsn }}<template v-if="school.lmsSchoolId"> • ID LMS {{ school.lmsSchoolId }}</template> • {{ school.level }} • Paket {{ school.pkg }} • {{ school.timezone }}
          <StatusChip :label="headStatus.label" :tone="headStatus.tone" class="sekolah__chip" />
        </p>
      </div>
      <v-spacer />
      <v-btn variant="outlined" prepend-icon="mdi-pencil-outline" @click="showSoon">Ubah data</v-btn>
      <v-btn prepend-icon="mdi-file-document-edit-outline" :disabled="!base" @click="renewalOpen = true">Catat perpanjangan</v-btn>
    </header>

    <SchoolTabs v-model="tab" :tabs="tabs" label="Bagian halaman sekolah" />

    <div v-if="tab === 'ringkasan'" class="sekolah__grid">
      <div class="sekolah__col">
        <SchoolCard title="Kontrak berjalan" :subtitle="current?.label">
          <template #action><StatusChip :label="cardStatus.label" :tone="cardStatus.tone" /></template>
          <div v-if="current" class="sekolah__tiles">
            <div class="sekolah__tile"><p>Periode</p><strong>{{ formatPeriod(current.start, current.end) }}</strong></div>
            <div class="sekolah__tile"><p>Nilai kontrak</p><strong>{{ formatRupiah(current.value) }}</strong></div>
            <div class="sekolah__tile"><p>Ditandatangani klien</p><strong>{{ formatDay(current.signedDate) }}</strong></div>
          </div>
        </SchoolCard>
        <SchoolCard title="Riwayat kontrak" subtitle="Retention = nilai perpanjangan ÷ nilai kontrak yang diperpanjang, tidak dibatasi 100%">
          <ContractHistory :contracts="detail.contracts" />
        </SchoolCard>
        <SchoolCard title="Kunjungan terbaru">
          <template #action><button type="button" class="sekolah__link" @click="tab = 'kunjungan'">Lihat semua</button></template>
          <div v-if="detail.visits.length" class="sekolah__visits">
            <table>
              <thead><tr><th class="v-date">Tanggal</th><th class="v-agent">Agent</th><th>Laporan</th><th class="v-dur">Durasi</th></tr></thead>
              <tbody>
                <tr v-for="v in detail.visits.slice(0, 3)" :key="v.id">
                  <td>{{ formatDay(v.date) }}</td><td>{{ v.agent }}</td><td class="v-report"><span>{{ v.report }}</span></td><td>{{ formatDuration(v.durationMinutes) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="sekolah__empty">Belum ada kunjungan ke sekolah ini.</p>
        </SchoolCard>
      </div>

      <div class="sekolah__col">
        <SchoolCard title="Agent ditugaskan">
          <template #action><button type="button" class="sekolah__link" @click="moveOpen = true">{{ agent ? 'Pindahkan' : 'Tugaskan' }}</button></template>
          <div v-if="agent" class="sekolah__agent">
            <span class="sekolah__avatar">{{ initials(agent.name) }}</span>
            <div>
              <p class="sekolah__agent-name">{{ agent.name }}</p>
              <p class="sekolah__agent-sub">{{ agent.timezone }} • sejak {{ formatDay(assignedSince) }} • porsi {{ detail.assignment?.sharePercent }}%</p>
            </div>
          </div>
          <StatusChip v-else label="Tanpa agent" tone="warning" />
        </SchoolCard>
        <SchoolCard title="Data sekolah">
          <dl class="sekolah__dl">
            <div><dt>Kota</dt><dd>{{ school.city }}</dd></div>
            <div><dt>Alamat</dt><dd>{{ school.address }}</dd></div>
            <div><dt>Zona waktu</dt><dd>{{ school.timezone }}</dd></div>
            <div><dt>PIC</dt><dd>{{ school.pic }}</dd></div>
            <div><dt>Kontak PIC</dt><dd>{{ school.picContact }}</dd></div>
          </dl>
        </SchoolCard>
        <SchoolCard title="Tanggal kerja sama">
          <dl class="sekolah__dl sekolah__dl--wide">
            <div><dt>Mulai kerja sama</dt><dd>{{ formatDay(school.coopStart) }}</dd></div>
            <div><dt>Onboarding</dt><dd>{{ school.onboarding ? formatDay(school.onboarding) : '–' }}</dd></div>
            <div><dt>Aktif menggunakan</dt><dd>{{ school.activeUse ? formatDay(school.activeUse) : '–' }}</dd></div>
            <div><dt>Berakhir</dt><dd>{{ formatDay(school.coopEnd) }}</dd></div>
          </dl>
        </SchoolCard>
      </div>
    </div>

    <SchoolCard v-else-if="tab === 'kontrak'" title="Riwayat kontrak" subtitle="Retention = nilai perpanjangan ÷ nilai kontrak yang diperpanjang, tidak dibatasi 100%">
      <ContractHistory :contracts="detail.contracts" />
    </SchoolCard>

    <SchoolCard v-else-if="tab === 'kunjungan'" title="Kunjungan">
      <div v-if="detail.visits.length" class="sekolah__visits">
        <table>
          <thead><tr><th class="v-date">Tanggal</th><th class="v-agent">Agent</th><th>Laporan</th><th class="v-dur">Durasi</th></tr></thead>
          <tbody>
            <tr v-for="v in detail.visits" :key="v.id">
              <td>{{ formatDay(v.date) }}</td><td>{{ v.agent }}</td><td class="v-report"><span>{{ v.report }}</span></td><td>{{ formatDuration(v.durationMinutes) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-else title="Belum ada kunjungan" description="Kunjungan agent ke sekolah ini akan muncul di sini." />
    </SchoolCard>

    <v-card v-else class="sekolah__changes">
      <v-data-table :headers="changeHeaders" :items="detail.changes" v-model:page="page" :items-per-page="perPage" hide-default-footer>
        <template #item.at="{ item }">{{ formatDateTimeWib(item.at) }}</template>
        <template #item.actor="{ item }"><p class="sekolah__agent-name">{{ item.actor }}</p><p class="sekolah__agent-sub">{{ item.actorRole }}</p></template>
        <template #item.action="{ item }"><StatusChip :label="item.action" :tone="actionTone[item.action]" /></template>
        <template #item.change="{ item }">
          <span class="sekolah__before">{{ item.before ?? '–' }}</span>
          <v-icon icon="mdi-chevron-right" size="16" class="sekolah__arrow" />
          <strong>{{ item.after }}</strong>
        </template>
        <template #no-data><EmptyState title="Belum ada perubahan" description="Perubahan data sekolah ini akan tercatat di sini." /></template>
        <template #bottom><DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="detail.changes.length" /></template>
      </v-data-table>
    </v-card>

    <RenewalDialog v-if="base" v-model="renewalOpen" :school-name="school.name" :base="base" :school-contracts="detail.contracts" @submit="onRenewal" />
    <MoveDialog
      v-model="moveOpen" :target="{ schoolId: school.id, name: school.name, npsn: school.npsn }" :agents="listAgents()"
      :current="agent && detail.assignment ? { agentId: agent.id, name: agent.name, since: detail.assignment.assignedAt } : null" @submit="onMove"
    />
    <v-snackbar v-model="snack.show" :timeout="3500" color="primary" location="bottom">{{ snack.text }}</v-snackbar>
  </div>
  <v-card v-else-if="loaded">
    <EmptyState title="Sekolah tidak ditemukan" description="Sekolah ini tidak ada atau sudah dihapus dari daftar." icon="mdi-school-outline">
      <v-btn to="/sekolah" variant="outlined">Kembali ke daftar</v-btn>
    </EmptyState>
  </v-card>
</template>

<style scoped>
.sekolah { display: flex; flex-direction: column; gap: 24px; }
.sekolah__crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 18px; color: rgb(var(--v-theme-text-secondary)); }
.sekolah__crumb a { color: rgb(var(--v-theme-primary)); font-weight: 500; text-decoration: none; }
.sekolah__head { display: flex; align-items: center; gap: 12px; }
.sekolah__icon {
  display: inline-flex; align-items: center; justify-content: center; flex: none; width: 48px; height: 48px; border-radius: 8px;
  background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary));
}
.sekolah__title { min-width: 0; }
.sekolah__title h1 { font-size: 24px; line-height: 32px; font-weight: 600; }
.sekolah__meta { display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.sekolah__chip { margin-top: 2px; }
.sekolah__grid { display: grid; grid-template-columns: 1fr 360px; gap: 24px; align-items: start; }
.sekolah__col { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.sekolah__tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.sekolah__tile { padding: 12px; border-radius: 8px; background: rgb(var(--v-theme-canvas-alt)); }
.sekolah__tile p { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.sekolah__tile strong { display: block; margin-top: 2px; font-size: 16px; line-height: 24px; font-weight: 600; }
.sekolah__link { font-size: 13px; line-height: 18px; font-weight: 600; color: rgb(var(--v-theme-primary)); border-radius: 5px; }
.sekolah__agent { display: flex; align-items: center; gap: 12px; }
.sekolah__avatar {
  display: inline-flex; align-items: center; justify-content: center; flex: none; width: 40px; height: 40px; border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft)); color: rgb(var(--v-theme-secondary)); font-size: 13px; font-weight: 600;
}
.sekolah__agent-name { font-size: 14px; line-height: 20px; font-weight: 600; }
.sekolah__agent-sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); font-weight: 400; }
.sekolah__dl > div { display: grid; grid-template-columns: 104px 1fr; align-items: center; gap: 8px; min-height: 48px; padding: 14px 0; border-bottom: 1px solid rgb(var(--v-theme-border-subtle)); }
.sekolah__dl--wide > div { grid-template-columns: 144px 1fr; }
.sekolah__dl { margin-top: -10px; }
.sekolah__dl > div:last-child { border-bottom: 0; padding-bottom: 6px; }
.sekolah__dl dt { font-size: 14px; color: rgb(var(--v-theme-text-secondary)); }
.sekolah__dl dd { font-size: 14px; line-height: 20px; font-weight: 500; }
.sekolah__visits { border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
.sekolah__visits table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 14px; }
.sekolah__visits th { height: 47px; padding: 0 16px; text-align: left; font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); background: rgb(var(--v-theme-canvas-table)); }
.sekolah__visits td { height: 60px; padding: 0 16px; border-top: 1px solid rgb(var(--v-theme-border-subtle)); }
.sekolah__visits .v-date { width: 130px; } .sekolah__visits .v-agent { width: 150px; } .sekolah__visits .v-dur { width: 100px; }
.sekolah__visits .v-report span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 20px; }
.sekolah__empty { font-size: 14px; color: rgb(var(--v-theme-text-secondary)); }
.sekolah__changes { overflow: hidden; }
.sekolah__before { color: rgb(var(--v-theme-text-secondary)); }
.sekolah__arrow { margin: 0 8px; color: rgb(var(--v-theme-text-secondary)); }
.sekolah__changes :deep(.v-table > .v-table__wrapper > table > thead > tr > th) { height: 47px; font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.sekolah__changes :deep(.v-table > .v-table__wrapper > table > tbody > tr > td) { height: 64px; }
</style>
