<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DialogShell from './DialogShell.vue'
import { setAccountActive } from '@/services/admin'
import type { MockAccount } from '@/mocks/admin'

// Hapus akun = nonaktifkan (is_active=false), bukan hard delete. Riwayat kunjungan tetap utuh.
const props = defineProps<{ account: MockAccount | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

const loading = ref(false)
const firstName = computed(() => props.account?.name.split(' ')[0] ?? 'Pengguna')
watch(open, (isOpen) => { if (isOpen) loading.value = false })

async function confirm() {
  if (!props.account) return
  loading.value = true
  try {
    await setAccountActive(props.account.id, false)
    open.value = false
    emit('done')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <DialogShell v-model="open" title="Hapus akun?" icon="mdi-trash-can-outline" tone="error" :subtitle="account ? `${account.name} · ${account.email}` : ''" :width="480" :top="160">
    <div class="del">
      <p class="del__text">
        Akun ini dinonaktifkan, bukan dihapus permanen. {{ firstName }} tidak bisa login lagi. Riwayat kunjungan yang pernah dicatat tetap tersimpan.
      </p>
      <div class="del__warn" role="alert">
        <v-icon icon="mdi-alert-outline" size="20" />
        <p>Penonaktifan tercatat di audit log.</p>
      </div>
      <div class="del__actions">
        <v-btn variant="outlined" :disabled="loading" @click="open = false">Batal</v-btn>
        <v-btn color="error" prepend-icon="mdi-trash-can-outline" :loading="loading" @click="confirm">Hapus akun</v-btn>
      </div>
    </div>
  </DialogShell>
</template>

<style scoped>
.del { display: flex; flex-direction: column; gap: 18px; }
.del__text { font-size: 14px; line-height: 20px; }
.del__warn { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 5px; background: rgb(var(--v-theme-error-surface)); color: rgb(var(--v-theme-error)); font-size: 14px; line-height: 20px; }
.del__actions { display: flex; justify-content: flex-end; gap: 12px; }
</style>
