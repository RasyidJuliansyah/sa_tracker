<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import AccountFormDialog from '@/components/admin/AccountFormDialog.vue'
import DeleteAccountDialog from '@/components/admin/DeleteAccountDialog.vue'
import ResetPasswordDialog from '@/components/admin/ResetPasswordDialog.vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatusChip, { type ChipTone } from '@/components/StatusChip.vue'
import type { AccountRole, AccountStatus, MockAccount } from '@/mocks/admin'
import { createAccount, listAccounts, resetAccountPassword, setAccountActive, updateAccount, type AccountInput } from '@/services/admin'

// Admin – Akun (Figma 25:2). Akun tidak dihapus, hanya dinonaktifkan.
const headers = [
  { title: 'Nama', key: 'name', sortable: false },
  { title: 'Peran', key: 'role', sortable: false, width: 130 },
  { title: 'Zona waktu', key: 'timezone', sortable: false, width: 120 },
  { title: 'Status', key: 'status', sortable: false, width: 220 },
  { title: 'Login terakhir', key: 'lastLoginLabel', sortable: false, width: 180 },
  { title: 'Aksi', key: 'actions', sortable: false, width: 140 },
]
const roleItems = [
  { title: 'Semua peran', value: null }, { title: 'Admin', value: 'ADMIN' }, { title: 'Manager', value: 'MANAGER' }, { title: 'Agent', value: 'AGENT' },
]
const statusItems = [
  { title: 'Semua status', value: null }, { title: 'Aktif', value: 'ACTIVE' },
  { title: 'Wajib ganti password', value: 'MUST_CHANGE_PASSWORD' }, { title: 'Nonaktif', value: 'INACTIVE' },
]
const roleChip: Record<AccountRole, { label: string; tone: ChipTone }> = {
  ADMIN: { label: 'Admin', tone: 'accent' }, MANAGER: { label: 'Manager', tone: 'info' }, AGENT: { label: 'Agent', tone: 'brand' },
}
const statusChip: Record<AccountStatus, { label: string; tone: ChipTone }> = {
  ACTIVE: { label: 'Aktif', tone: 'success' }, MUST_CHANGE_PASSWORD: { label: 'Wajib ganti password', tone: 'warning' }, INACTIVE: { label: 'Nonaktif', tone: 'neutral' },
}

const items = ref<MockAccount[]>([])
const query = ref('')
const role = ref<string | null>(null)
const status = ref<string | null>(null)
const page = ref(1)
const perPage = ref(10)

const formOpen = ref(false)
const editing = ref<MockAccount | null>(null)
const resetOpen = ref(false)
const resetTarget = ref<MockAccount | null>(null)
const deleteOpen = ref(false)
const deleteTarget = ref<MockAccount | null>(null)

const statusRank: Record<AccountStatus, number> = { ACTIVE: 0, MUST_CHANGE_PASSWORD: 1, INACTIVE: 2 }
async function load() {
  const data = await listAccounts({ query: query.value, role: role.value as AccountRole | null, status: status.value as AccountStatus | null })
  items.value = [...data].sort((a, b) => statusRank[a.status] - statusRank[b.status])
}
onMounted(load)
watch([query, role, status], () => { page.value = 1; load() })

const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()

function openCreate() { editing.value = null; formOpen.value = true }
function openEdit(a: MockAccount) { editing.value = a; formOpen.value = true }
function openReset(a: MockAccount) { resetTarget.value = a; resetOpen.value = true }
function openDelete(a: MockAccount) { deleteTarget.value = a; deleteOpen.value = true }

async function onSubmit(input: AccountInput) {
  if (editing.value) await updateAccount(editing.value.id, input)
  else await createAccount(input)
  await load()
}
async function onToggleActive() {
  if (!editing.value) return
  await setAccountActive(editing.value.id, editing.value.status === 'INACTIVE')
  await load()
}
</script>

<template>
  <div class="akun">
    <div class="akun__filters">
      <LabeledField id="f-cari" v-model="query" label="Cari" placeholder="Cari nama atau email" append-inner-icon="mdi-magnify" class="akun__search" />
      <LabeledSelect id="f-peran" v-model="role" label="Peran" :items="roleItems" class="akun__select" />
      <LabeledSelect id="f-status" v-model="status" label="Status" :items="statusItems" class="akun__select" />
      <v-spacer />
      <v-btn variant="outlined" prepend-icon="mdi-upload" to="/akun/impor-ekspor">Impor CSV</v-btn>
      <v-btn variant="outlined" prepend-icon="mdi-download" to="/akun/impor-ekspor?tab=ekspor">Ekspor CSV</v-btn>
      <v-btn prepend-icon="mdi-account-plus-outline" @click="openCreate">Tambah akun</v-btn>
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
        <template #item.role="{ item }"><StatusChip :label="roleChip[item.role].label" :tone="roleChip[item.role].tone" /></template>
        <template #item.status="{ item }"><StatusChip :label="statusChip[item.status].label" :tone="statusChip[item.status].tone" /></template>
        <template #item.actions="{ item }">
          <div class="akun__actions">
            <button type="button" class="akun__icon" :aria-label="`Ubah akun ${item.name}`" @click="openEdit(item)"><v-icon icon="mdi-pencil-outline" size="20" /></button>
            <button type="button" class="akun__icon" :aria-label="`Reset password ${item.name}`" @click="openReset(item)"><v-icon icon="mdi-key-outline" size="20" /></button>
            <button v-if="item.status !== 'INACTIVE'" type="button" class="akun__icon akun__icon--danger" :aria-label="`Hapus akun ${item.name}`" @click="openDelete(item)"><v-icon icon="mdi-trash-can-outline" size="20" /></button>
          </div>
        </template>
        <template #no-data><EmptyState title="Akun tidak ditemukan" description="Coba ubah kata kunci atau filter peran dan status." icon="mdi-account-search-outline" /></template>
        <template #bottom>
          <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="items.length" />
        </template>
      </v-data-table>
    </v-card>

    <p class="akun__note">Akun tidak dihapus, hanya dinonaktifkan, supaya riwayat kunjungan tetap utuh. Ikon kunci untuk reset password.</p>

    <AccountFormDialog v-model="formOpen" :account="editing" @submit="onSubmit" @toggle-active="onToggleActive" />
    <ResetPasswordDialog v-model="resetOpen" :account="resetTarget" @done="load" />
    <DeleteAccountDialog v-model="deleteOpen" :account="deleteTarget" @done="load" />
  </div>
</template>

<style scoped>
.akun { display: flex; flex-direction: column; gap: 24px; }
.akun__filters { display: flex; align-items: flex-end; gap: 12px; }
.akun__search { width: 320px; }
.akun__select { width: 180px; }
.akun__table { overflow: hidden; }
.akun__person { display: flex; align-items: center; gap: 12px; }
.akun__avatar {
  display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft)); color: rgb(var(--v-theme-secondary)); font-size: 13px; font-weight: 500;
}
.akun__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.akun__email { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.akun__actions { display: flex; gap: 12px; }
.akun__icon { display: inline-flex; border-radius: 5px; color: rgb(var(--v-theme-primary)); }
.akun__icon--danger { color: rgb(var(--v-theme-error)); }
.akun__note { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.akun :deep(.v-table > .v-table__wrapper > table > thead > tr > th) { height: 47px; font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.akun :deep(.v-table > .v-table__wrapper > table > tbody > tr > td) { height: 64px; }
.akun :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
</style>
