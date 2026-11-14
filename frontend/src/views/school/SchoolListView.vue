<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatusChip from '@/components/StatusChip.vue'
import { formatPeriod, listStatusLabel } from '@/components/school/school-format'
import { LEVELS, PACKAGES } from '@/mocks/school'
import { listAgents, listSchools, type SchoolRow } from '@/services/school'
import { formatRupiah } from '@/utils/format'

// Sekolah – Daftar (Figma 22:320). Nilai kontrak hanya untuk admin dan manager (layar ini tidak dipakai agent).
const router = useRouter()
const headers = [
  { title: 'Sekolah', key: 'name', sortable: false },
  { title: 'Jenjang · paket', key: 'levelPkg', sortable: false, width: 140 },
  { title: 'Agent', key: 'agent', sortable: false, width: 150 },
  { title: 'Kontrak berjalan', key: 'period', sortable: false, width: 200 },
  { title: 'Nilai kontrak', key: 'value', sortable: false, width: 150, align: 'end' as const },
  { title: 'Status perpanjangan', key: 'status', sortable: false, width: 226 },
  { title: '​', key: 'open', sortable: false, width: 38 },
]
const all = ref<SchoolRow[]>([])
const items = ref<SchoolRow[]>([])
const query = ref('')
const level = ref<string | null>(null)
const pkg = ref<string | null>(null)
const status = ref<string | null>(null)
const agent = ref<string | null>(null)
const page = ref(1)
const perPage = ref(10)

const levelItems = [{ title: 'Semua', value: null }, ...LEVELS.map((v) => ({ title: v, value: v }))]
const pkgItems = [{ title: 'Semua', value: null }, ...PACKAGES.map((v) => ({ title: v, value: v }))]
const statusItems = [
  { title: 'Semua', value: null }, { title: 'Berjalan', value: 'RUNNING' }, { title: 'Segera berakhir', value: 'ENDING_SOON' },
  { title: 'Berakhir, belum diperpanjang', value: 'EXPIRED' }, { title: 'Sudah diperpanjang', value: 'RENEWED' },
]
const agentItems = [
  { title: 'Semua', value: null }, ...listAgents().map((a) => ({ title: a.name, value: String(a.id) })), { title: 'Tanpa agent', value: 'NONE' },
]

const summary = computed(() => {
  const noAgent = all.value.filter((r) => !r.agent).length
  const expired = all.value.filter((r) => r.status?.kind === 'EXPIRED').length
  return { total: all.value.length, line: `${noAgent} tanpa agent · ${expired} kontrak berakhir belum diperpanjang` }
})

async function load() {
  all.value = await listSchools({ query: '', level: null, pkg: null, status: null, agent: null })
  items.value = await listSchools({ query: query.value, level: level.value, pkg: pkg.value, status: status.value, agent: agent.value })
}
onMounted(load)
watch([query, level, pkg, status, agent], () => { page.value = 1; load() })

const open = (r: SchoolRow) => router.push(`/sekolah/${r.school.id}`)
</script>

<template>
  <div class="daftar">
    <div class="daftar__head">
      <div>
        <p class="daftar__count">{{ summary.total }} sekolah klien</p>
        <p class="daftar__meta">{{ summary.line }}</p>
      </div>
      <div class="daftar__actions">
        <v-btn variant="outlined" prepend-icon="mdi-upload" to="/impor-ekspor">Impor CSV</v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-download" to="/impor-ekspor?tab=ekspor">Ekspor CSV</v-btn>
        <v-btn prepend-icon="mdi-plus" to="/sekolah/baru">Tambah sekolah</v-btn>
      </div>
    </div>

    <div class="daftar__filters">
      <div class="daftar__search"><LabeledField id="f-cari" v-model="query" label="Cari" placeholder="Cari nama sekolah atau NPSN" append-inner-icon="mdi-magnify" /></div>
      <LabeledSelect id="f-jenjang" v-model="level" label="Jenjang" :items="levelItems" class="daftar__s160" />
      <LabeledSelect id="f-paket" v-model="pkg" label="Paket" :items="pkgItems" class="daftar__s160" />
      <LabeledSelect id="f-status" v-model="status" label="Status kontrak" :items="statusItems" class="daftar__s220" />
      <LabeledSelect id="f-agent" v-model="agent" label="Agent" :items="agentItems" class="daftar__s200" />
    </div>

    <v-card class="daftar__table">
      <v-data-table
        :headers="headers" :items="items" v-model:page="page" :items-per-page="perPage" hide-default-footer
        item-value="school.id" @click:row="(_e: Event, row: { item: SchoolRow }) => open(row.item)"
      >
        <template #item.name="{ item }">
          <p class="daftar__name">{{ item.school.name }}</p>
          <p class="daftar__sub">NPSN {{ item.school.npsn }} • {{ item.school.city }}</p>
        </template>
        <template #item.levelPkg="{ item }">{{ item.school.level }} • {{ item.school.pkg }}</template>
        <template #item.agent="{ item }">
          <StatusChip v-if="!item.agent" label="Tanpa agent" tone="warning" />
          <template v-else>{{ item.agent.name }}</template>
        </template>
        <template #item.period="{ item }">{{ item.contract ? formatPeriod(item.contract.start, item.contract.end) : '–' }}</template>
        <template #item.value="{ item }">{{ item.contract ? formatRupiah(item.contract.value) : '–' }}</template>
        <template #item.status="{ item }">
          <StatusChip :label="listStatusLabel(item.status).label" :tone="listStatusLabel(item.status).tone" />
        </template>
        <template #item.open="{ item }">
          <button type="button" class="daftar__open" :aria-label="`Buka halaman ${item.school.name}`" @click.stop="open(item)">
            <v-icon icon="mdi-chevron-right" size="20" />
          </button>
        </template>
        <template #no-data><EmptyState title="Sekolah tidak ditemukan" description="Coba ubah kata kunci atau filter." icon="mdi-school-outline" /></template>
        <template #bottom>
          <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="items.length" />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.daftar { display: flex; flex-direction: column; gap: 24px; }
.daftar__head { display: flex; align-items: center; justify-content: space-between; }
.daftar__count { font-size: 14px; line-height: 20px; font-weight: 500; }
.daftar__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.daftar__actions { display: flex; gap: 12px; }
.daftar__filters { display: flex; align-items: flex-end; gap: 12px; }
.daftar__search { flex: none; width: 320px; }
.daftar__s160 { flex: none; width: 160px; }
.daftar__s220 { flex: none; width: 220px; }
.daftar__s200 { flex: none; width: 200px; }
.daftar__table { overflow: hidden; }
.daftar__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.daftar__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.daftar__open { display: inline-flex; border-radius: 5px; color: rgb(var(--v-theme-text-secondary)); }
.daftar :deep(tbody tr) { cursor: pointer; }
.daftar :deep(th:last-child), .daftar :deep(td:last-child) { width: 38px; padding-left: 0; padding-right: 8px; }
.daftar :deep(.v-table > .v-table__wrapper > table > thead > tr > th) { height: 47px; font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.daftar :deep(.v-table > .v-table__wrapper > table > tbody > tr > td) { height: 64px; }
.daftar :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
</style>
