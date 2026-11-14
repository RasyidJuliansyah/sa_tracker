<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MasterCard from '@/components/admin/MasterCard.vue'
import type { MockMasterItem } from '@/mocks/admin'
import { createMaster, listMaster, masterNameExists, renameMaster, setMasterActive, type MasterKind } from '@/services/admin'

// Admin – Master jenjang & paket (Figma 25:1013). Data yang sudah dipakai dinonaktifkan, tidak dihapus.
const levels = ref<MockMasterItem[]>([])
const packages = ref<MockMasterItem[]>([])

async function load() {
  levels.value = await listMaster('level')
  packages.value = await listMaster('package')
}
onMounted(load)

async function create(kind: MasterKind, name: string) { await createMaster(kind, name); await load() }
async function rename(kind: MasterKind, id: number, name: string) { await renameMaster(kind, id, name); await load() }
async function toggle(kind: MasterKind, id: number, active: boolean) { await setMasterActive(kind, id, active); await load() }
</script>

<template>
  <div class="master-data">
    <div class="master-data__alert" role="note">
      <v-icon icon="mdi-information-outline" size="20" />
      <p>Jenjang atau paket yang sudah dipakai sekolah tidak bisa dihapus, hanya dinonaktifkan. Nama di sini dipakai untuk mencocokkan impor CSV.</p>
    </div>
    <div class="master-data__cards">
      <MasterCard
        title="Jenjang" noun="jenjang" placeholder="Contoh: SMK Plus" :items="levels" :exists="(n, id) => masterNameExists('level', n, id)"
        @create="(n) => create('level', n)" @rename="(i, n) => rename('level', i, n)" @toggle="(i, a) => toggle('level', i, a)"
      />
      <MasterCard
        title="Paket" noun="paket" placeholder="Contoh: Premium Plus" :items="packages" initially-adding :exists="(n, id) => masterNameExists('package', n, id)"
        @create="(n) => create('package', n)" @rename="(i, n) => rename('package', i, n)" @toggle="(i, a) => toggle('package', i, a)"
      />
    </div>
  </div>
</template>

<style scoped>
.master-data { display: flex; flex-direction: column; gap: 24px; }
.master-data__alert {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 8px;
  background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); font-size: 14px; line-height: 20px;
}
.master-data__cards { display: flex; gap: 24px; align-items: flex-start; }
</style>
