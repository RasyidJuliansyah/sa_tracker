<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AuditDetailPanel from '@/components/admin/AuditDetailPanel.vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import StatusChip, { type ChipTone } from '@/components/StatusChip.vue'
import type { AuditAction, MockAuditEntry } from '@/mocks/admin'
import { auditDataTypes, listAudit, listAuditActors } from '@/services/admin'
import { IANA_ZONE } from '@/utils/timezone'

// Audit log (Figma 25:1265). Dipakai admin dan manager, tidak bergantung pada peran. Hanya baca.
const actionMeta: Record<AuditAction, { label: string; tone: ChipTone }> = {
  CHECK_OUT: { label: 'Check-out', tone: 'info' }, CHECK_IN: { label: 'Check-in', tone: 'info' }, LOGIN: { label: 'Login', tone: 'neutral' },
  EXPORT: { label: 'Ekspor', tone: 'brand' }, MOVE: { label: 'Pindah', tone: 'accent' }, CREATE: { label: 'Tambah', tone: 'success' },
  UPDATE: { label: 'Ubah', tone: 'warning' }, LOGIN_FAILED: { label: 'Login gagal', tone: 'error' }, PASSWORD_CHANGE: { label: 'Reset password', tone: 'warning' }, IMPORT: { label: 'Impor', tone: 'brand' }, DEACTIVATE: { label: 'Nonaktifkan', tone: 'error' },
}
const headers = [
  { title: 'Waktu', key: 'at', sortable: false, width: 130 },
  { title: 'Pelaku', key: 'actor', sortable: false, width: 170 },
  { title: 'Aksi', key: 'action', sortable: false, width: 130 },
  { title: 'Data', key: 'dataLabel', sortable: false },
]
const typeItems = [{ title: 'Semua jenis', value: null }, ...auditDataTypes.map((t) => ({ title: t, value: t }))]
const actionItems = [{ title: 'Semua aksi', value: null }, ...Object.entries(actionMeta).map(([value, m]) => ({ title: m.label, value }))]
const actorItems = ref<{ title: string; value: string | null }[]>([{ title: 'Semua pelaku', value: null }])
onMounted(async () => { actorItems.value = [{ title: 'Semua pelaku', value: null }, ...(await listAuditActors()).map((a) => ({ title: a, value: a }))] })

const items = ref<MockAuditEntry[]>([])
const dataType = ref<string | null>(null)
const action = ref<string | null>(null)
const actor = ref<string | null>(null)
const range = ref<Date[]>([new Date(2026, 10, 8), new Date(2026, 10, 14)])
const dateMenu = ref(false)
const page = ref(1)
const perPage = ref(10)
const selectedId = ref<number | null>(308)

const bounds = computed(() => {
  if (!range.value.length) return { from: null, to: null }
  const times = range.value.map((d) => d.getTime())
  return { from: new Date(Math.min(...times)), to: new Date(Math.max(...times)) }
})

const wib = (opts: Intl.DateTimeFormatOptions, d: string | Date) => new Intl.DateTimeFormat('id-ID', { ...opts, timeZone: IANA_ZONE.WIB }).format(new Date(d))
const clock = (iso: string) => wib({ hour: '2-digit', minute: '2-digit', hour12: false }, iso)
const shortWhen = (iso: string) => `${wib({ day: 'numeric', month: 'short' }, iso)}, ${clock(iso)}`
const fullWhen = (iso: string) => `${wib({ day: 'numeric', month: 'long', year: 'numeric' }, iso).replace('November', 'Nov')}, ${clock(iso)} WIB`
const local = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat('id-ID', opts).format(d)
const rangeLabel = computed(() => {
  const { from, to } = bounds.value
  if (!from || !to) return 'Semua tanggal'
  const sameDay = from.getTime() === to.getTime()
  const f = local({ day: 'numeric' }, from)
  const end = local({ day: 'numeric', month: 'short', year: 'numeric' }, to)
  if (sameDay) return end
  return from.getMonth() === to.getMonth() ? `${f}–${end}` : `${local({ day: 'numeric', month: 'short' }, from)}–${end}`
})

async function load() {
  items.value = await listAudit({ dataType: dataType.value, action: action.value, actor: actor.value, ...bounds.value })
}
onMounted(load)
watch([dataType, action, actor, range], () => { page.value = 1; load() })

const selected = computed(() => items.value.find((e) => e.id === selectedId.value) ?? null)
const selectedMeta = computed(() => (selected.value ? actionMeta[selected.value.action] : { label: '', tone: 'neutral' as ChipTone }))
function rowProps({ item }: { item: MockAuditEntry }) {
  return { class: item.id === selectedId.value ? 'audit__row--selected' : '', 'data-testid': 'audit-row', tabindex: 0, onKeydown: (e: KeyboardEvent) => { if (e.key === 'Enter') selectedId.value = item.id } }
}
function pick(_: Event, { item }: { item: MockAuditEntry }) { selectedId.value = item.id }
</script>

<template>
  <div class="audit">
    <div class="audit__filters">
      <LabeledSelect id="a-jenis" v-model="dataType" label="Jenis data" :items="typeItems" class="audit__f200" />
      <LabeledSelect id="a-aksi" v-model="action" label="Aksi" :items="actionItems" class="audit__f180" />
      <LabeledSelect id="a-pelaku" v-model="actor" label="Pelaku" :items="actorItems" class="audit__f200" />
      <div class="audit__date">
        <label for="a-tanggal" class="audit__date-label">Tanggal</label>
        <v-menu v-model="dateMenu" :close-on-content-click="false">
          <template #activator="{ props: menu }">
            <button id="a-tanggal" v-bind="menu" type="button" class="audit__date-field" aria-label="Pilih rentang tanggal">
              <span>{{ rangeLabel }}</span>
              <v-icon icon="mdi-calendar-month-outline" size="20" />
            </button>
          </template>
          <v-card class="audit__picker">
            <v-date-picker v-model="range" multiple="range" hide-header color="primary" />
            <div class="audit__picker-actions">
              <v-btn variant="text" @click="range = []">Semua tanggal</v-btn>
              <v-btn @click="dateMenu = false">Terapkan</v-btn>
            </div>
          </v-card>
        </v-menu>
      </div>
    </div>

    <div class="audit__body">
      <v-card class="audit__table">
        <v-data-table
          :headers="headers" :items="items" v-model:page="page" :items-per-page="perPage" hide-default-footer
          :row-props="rowProps" @click:row="pick"
        >
          <template #item.at="{ item }">{{ shortWhen(item.at) }}</template>
          <template #item.actor="{ item }">
            <div>
              <p class="audit__actor">{{ item.actor }}</p>
              <p class="audit__role">{{ item.actorRole }}</p>
            </div>
          </template>
          <template #item.action="{ item }"><StatusChip :label="actionMeta[item.action].label" :tone="actionMeta[item.action].tone" /></template>
          <template #no-data><EmptyState title="Tidak ada catatan" description="Tidak ada aktivitas yang cocok dengan filter ini." icon="mdi-history" /></template>
          <template #bottom>
            <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="items.length" />
          </template>
        </v-data-table>
      </v-card>
      <AuditDetailPanel :entry="selected" :when-label="selected ? fullWhen(selected.at) : ''" :action-label="selectedMeta.label" :action-tone="selectedMeta.tone" />
    </div>
  </div>
</template>

<style scoped>
.audit { display: flex; flex-direction: column; gap: 24px; }
.audit__filters { display: flex; align-items: flex-end; gap: 12px; }
.audit__f200 { width: 200px; }
.audit__f180 { width: 180px; }
.audit__date { width: 220px; display: flex; flex-direction: column; gap: 6px; }
.audit__date-label { font-size: 13px; line-height: 18px; font-weight: 500; }
.audit__date-field {
  display: flex; align-items: center; justify-content: space-between; height: 42px; padding: 0 12px; border-radius: 5px;
  border: 1px solid rgb(var(--v-theme-border)); background: rgb(var(--v-theme-surface)); font-size: 14px; text-align: left;
}
.audit__picker { padding: 8px; }
.audit__picker-actions { display: flex; justify-content: space-between; padding: 8px; }
.audit__body { display: flex; gap: 24px; align-items: flex-start; }
.audit__table { flex: 1 1 0; min-width: 0; overflow: hidden; }
.audit__actor { font-size: 14px; line-height: 20px; font-weight: 500; }
.audit__role { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.audit :deep(.v-table > .v-table__wrapper > table > thead > tr > th) { height: 47px; font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.audit :deep(.v-table > .v-table__wrapper > table > tbody > tr > td) { height: 60px; }
.audit :deep(tbody tr) { cursor: pointer; }
.audit :deep(tbody tr.audit__row--selected td) { background: rgb(var(--v-theme-brand-softer)); }
</style>
