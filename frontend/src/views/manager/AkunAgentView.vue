<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatusChip from '@/components/StatusChip.vue'
import EditAgentDialog from '@/components/manager/EditAgentDialog.vue'
import type { MockAgent } from '@/mocks/manager'
import { listAgents, updateAgent, type AgentInput } from '@/services/manager'

// Manager – Akun agent (Figma 20:705). Tanpa tombol tambah akun: akun hanya dibuat admin.
const headers = [
  { title: 'Nama', key: 'name', sortable: false },
  { title: 'Peran', key: 'role', sortable: false, width: 110 },
  { title: 'Zona waktu', key: 'timezone', sortable: false, width: 120 },
  { title: 'Sekolah ditugaskan', key: 'schoolCount', sortable: false, width: 170 },
  { title: 'Status', key: 'active', sortable: false, width: 120 },
  { title: 'Login terakhir', key: 'lastLoginLabel', sortable: false, width: 170 },
  { title: '​', key: 'actions', sortable: false, width: 64 },
]
const statusItems = [{ title: 'Semua status', value: null }, { title: 'Aktif', value: 'ACTIVE' }, { title: 'Nonaktif', value: 'INACTIVE' }]

const items = ref<MockAgent[]>([])
const query = ref('')
const status = ref<string | null>(null)
const page = ref(1)
const perPage = ref(10)
const formOpen = ref(false)
const editing = ref<MockAgent | null>(null)

async function load() {
  items.value = await listAgents({ query: query.value, status: status.value as 'ACTIVE' | 'INACTIVE' | null })
}
onMounted(load)
watch([query, status], () => { page.value = 1; load() })

const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
function openEdit(a: MockAgent) { editing.value = a; formOpen.value = true }
async function onSubmit(input: AgentInput) {
  if (!editing.value) return
  await updateAgent(editing.value.id, input)
  await load()
}
</script>

<template>
  <div class="akun">
    <div class="akun__alert" role="note">
      <v-icon icon="mdi-information-outline" size="20" />
      <p>Akun baru hanya dibuat oleh admin. Manager bisa mengubah nama, zona waktu, dan status akun berperan agent.</p>
    </div>

    <div class="akun__filters">
      <div class="akun__search">
        <LabeledField id="f-cari" v-model="query" label="Cari" placeholder="Cari nama atau email" append-inner-icon="mdi-magnify" />
      </div>
      <LabeledSelect id="f-status" v-model="status" label="Status" :items="statusItems" class="akun__select" />
    </div>

    <v-card class="akun__table">
      <v-data-table :headers="headers" :items="items" v-model:page="page" :items-per-page="perPage" hide-default-footer>
        <template #item.name="{ item }">
          <div class="akun__person">
            <span class="akun__avatar">{{ initials(item.name) }}</span>
            <div>
              <p class="akun__name">{{ item.name }}</p>
              <p class="akun__email">{{ item.email }}</p>
            </div>
          </div>
        </template>
        <template #item.role><StatusChip label="Agent" tone="brand" /></template>
        <template #item.schoolCount="{ item }">{{ item.schoolCount }} sekolah</template>
        <template #item.active="{ item }"><StatusChip :label="item.active ? 'Aktif' : 'Nonaktif'" :tone="item.active ? 'success' : 'neutral'" /></template>
        <template #item.actions="{ item }">
          <button type="button" class="akun__icon" :aria-label="`Ubah akun ${item.name}`" @click="openEdit(item)"><v-icon icon="mdi-pencil-outline" size="20" /></button>
        </template>
        <template #no-data><EmptyState title="Akun agent tidak ditemukan" description="Coba ubah kata kunci atau filter status." icon="mdi-account-search-outline" /></template>
        <template #bottom>
          <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="items.length" />
        </template>
      </v-data-table>
    </v-card>

    <EditAgentDialog v-model="formOpen" :agent="editing" @submit="onSubmit" />
  </div>
</template>

<style scoped>
.akun { display: flex; flex-direction: column; gap: 24px; }
.akun__alert {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 8px;
  background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info));
  font-size: 14px; line-height: 20px;
}
.akun__filters { display: flex; align-items: flex-end; gap: 16px; }
.akun__search { width: 320px; }
.akun__select { width: 200px; }
.akun__table { overflow: hidden; }
.akun__person { display: flex; align-items: center; gap: 12px; }
.akun__avatar {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft)); color: rgb(var(--v-theme-secondary)); font-size: 13px; font-weight: 500;
}
.akun__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.akun__email { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.akun__icon { display: inline-flex; border-radius: 5px; color: rgb(var(--v-theme-primary)); }
.akun :deep(.v-table > .v-table__wrapper > table > thead > tr > th) { height: 47px; font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.akun :deep(.v-table > .v-table__wrapper > table > tbody > tr > td) { height: 64px; }
.akun :deep(.table-footer) { border-top: 1px solid rgb(var(--v-theme-border)); }
.akun :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
</style>
