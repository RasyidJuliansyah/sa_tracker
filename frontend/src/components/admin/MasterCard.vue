<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import StatusChip from '@/components/StatusChip.vue'
import type { MockMasterItem } from '@/mocks/admin'

// Kartu master (Figma 25:1013): tabel nama, jumlah sekolah, status, aksi; form tambah di bawah.
const props = defineProps<{
  title: string
  noun: string // 'jenjang' | 'paket'
  items: MockMasterItem[]
  placeholder: string
  exists: (name: string, exceptId?: number) => boolean
  initiallyAdding?: boolean
}>()
const emit = defineEmits<{ create: [string]; rename: [number, string]; toggle: [number, boolean] }>()

const adding = ref(props.initiallyAdding ?? false)
const newName = ref('')
const addError = ref('')
const editId = ref<number | null>(null)
const editName = ref('')
const editError = ref('')
const addInput = ref<{ focus: () => void } | null>(null)

const activeCount = computed(() => props.items.filter((i) => i.active).length)

async function startAdd() {
  adding.value = true
  await nextTick()
  addInput.value?.focus()
}
function validate(name: string, exceptId?: number): string {
  if (!name.trim()) return `Nama ${props.noun} wajib diisi`
  if (props.exists(name, exceptId)) return `Nama ${props.noun} sudah ada`
  return ''
}
function submitAdd() {
  addError.value = validate(newName.value)
  if (addError.value) return
  emit('create', newName.value)
  newName.value = ''
}
function startEdit(item: MockMasterItem) { editId.value = item.id; editName.value = item.name; editError.value = '' }
function submitEdit() {
  if (editId.value === null) return
  editError.value = validate(editName.value, editId.value)
  if (editError.value) return
  emit('rename', editId.value, editName.value)
  editId.value = null
}
</script>

<template>
  <v-card class="master">
    <div class="master__head">
      <div>
        <h2 class="master__title">{{ title }}</h2>
        <p class="master__sub">{{ items.length }} {{ noun }} · {{ activeCount }} aktif</p>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-plus" :aria-label="`Tambah ${noun}`" @click="startAdd">Tambah</v-btn>
    </div>

    <div class="master__table" role="table" :aria-label="`Tabel ${noun}`">
      <div class="master__row master__row--head" role="row">
        <span class="master__cell master__cell--grow" role="columnheader">Nama</span>
        <span class="master__cell master__cell--used" role="columnheader">Dipakai</span>
        <span class="master__cell master__cell--status" role="columnheader">Status</span>
        <span class="master__cell master__cell--actions" role="columnheader">Aksi</span>
      </div>
      <div v-for="item in items" :key="item.id" class="master__row" role="row">
        <span class="master__cell master__cell--grow master__name" role="cell">
          <template v-if="editId === item.id">
            <v-text-field
              v-model="editName" density="compact" hide-details="auto" :error-messages="editError" :aria-label="`Nama ${noun}`" autofocus
              @keydown.enter.prevent="submitEdit" @keydown.esc.stop="editId = null"
            />
          </template>
          <template v-else>{{ item.name }}</template>
        </span>
        <span class="master__cell master__cell--used" role="cell">{{ item.schoolCount }} sekolah</span>
        <span class="master__cell master__cell--status" role="cell">
          <StatusChip :label="item.active ? 'Aktif' : 'Nonaktif'" :tone="item.active ? 'success' : 'neutral'" />
        </span>
        <span class="master__cell master__cell--actions" role="cell">
          <template v-if="editId === item.id">
            <button type="button" class="master__icon" :aria-label="`Simpan nama ${item.name}`" @click="submitEdit"><v-icon icon="mdi-check" size="20" /></button>
            <button type="button" class="master__icon" aria-label="Batal ubah" @click="editId = null"><v-icon icon="mdi-close" size="20" /></button>
          </template>
          <template v-else>
            <button type="button" class="master__icon" :aria-label="`Ubah ${noun} ${item.name}`" @click="startEdit(item)"><v-icon icon="mdi-pencil-outline" size="20" /></button>
            <button
              type="button" class="master__icon"
              :aria-label="`${item.active ? 'Nonaktifkan' : 'Aktifkan'} ${noun} ${item.name}`"
              @click="emit('toggle', item.id, !item.active)"
            >
              <v-icon :icon="item.active ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" size="20" />
            </button>
          </template>
        </span>
      </div>
    </div>

    <form v-if="adding" class="master__add" novalidate @submit.prevent="submitAdd">
      <label :for="`new-${noun}`" class="master__add-label">Nama {{ noun }} baru</label>
      <div class="master__add-row">
        <v-text-field :id="`new-${noun}`" ref="addInput" v-model="newName" :placeholder="placeholder" hide-details="auto" :error-messages="addError" />
        <v-btn type="submit">Simpan</v-btn>
      </div>
    </form>
  </v-card>
</template>

<style scoped>
.master { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 16px; padding: 24px; align-self: flex-start; }
.master__head { display: flex; align-items: center; justify-content: space-between; }
.master__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.master__sub { margin-top: 2px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.master__table { border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
.master__row { display: flex; align-items: center; height: 52px; border-bottom: 1px solid rgb(var(--v-theme-border)); background: rgb(var(--v-theme-surface)); }
.master__row:last-child { border-bottom: 0; }
.master__row--head { height: 47px; background: rgb(var(--v-theme-canvas-table)); font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.master__cell { display: flex; align-items: center; padding: 0 16px; height: 100%; font-size: 14px; line-height: 20px; }
.master__row--head .master__cell { font-size: 13px; line-height: 18px; }
.master__cell--grow { flex: 1 1 0; min-width: 0; }
.master__cell--used { width: 120px; justify-content: flex-end; }
.master__cell--status { width: 120px; }
.master__cell--actions { width: 90px; gap: 16px; }
.master__name { font-weight: 500; }
.master__icon { display: inline-flex; border-radius: 5px; color: rgb(var(--v-theme-primary)); }
.master__add { border-top: 1px solid rgb(var(--v-theme-border)); padding-top: 16px; display: flex; flex-direction: column; gap: 6px; }
.master__add-label { font-size: 13px; line-height: 18px; font-weight: 500; }
.master__add-row { display: flex; align-items: flex-start; gap: 12px; }
.master__add-row :deep(.v-input) { flex: 1; }
.master :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
</style>
