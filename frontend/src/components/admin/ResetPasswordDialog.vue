<script setup lang="ts">
import { ref, watch } from 'vue'
import DialogShell from './DialogShell.vue'
import { generateTempPassword, resetAccountPassword } from '@/services/admin'
import type { MockAccount } from '@/mocks/admin'

// Dialog reset password (Figma 25:692). Dua tahap: konfirmasi, lalu tampilkan password sementara yang baru.
const props = defineProps<{ account: MockAccount | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ done: [] }>()

const newPassword = ref('')
const copied = ref(false)
const applied = ref(false)
watch(open, (isOpen) => {
  if (isOpen) { newPassword.value = generateTempPassword(); copied.value = false; applied.value = false }
})

const firstName = () => props.account?.name.split(' ')[0] ?? ''

async function reset() {
  if (!props.account) return
  await resetAccountPassword(props.account.id, newPassword.value)
  applied.value = true
  emit('done')
}
async function copy() {
  await navigator.clipboard?.writeText(newPassword.value).catch(() => undefined)
  copied.value = true
}
</script>

<template>
  <DialogShell v-model="open" title="Reset password" :subtitle="account ? `${account.name} • ${account.email}` : ''" :width="480" :top="160">
    <p class="reset__text">
      Password sementara baru akan dibuat. {{ firstName() }} wajib menggantinya saat login berikutnya. Kirimkan password ini lewat jalur yang aman.
    </p>
    <div class="reset__password" data-testid="temp-password">
      <span class="reset__value">{{ newPassword }}</span>
      <button type="button" class="reset__copy" @click="copy">{{ copied ? 'Tersalin' : 'Salin' }}</button>
    </div>
    <div class="reset__info" role="note">
      <v-icon icon="mdi-information-outline" size="20" />
      <span>{{ applied ? 'Password sementara sudah aktif. Salin dan kirimkan ke pengguna.' : 'Reset password tercatat di audit log.' }}</span>
    </div>
    <div class="reset__actions">
      <v-btn variant="outlined" @click="open = false">{{ applied ? 'Tutup' : 'Batal' }}</v-btn>
      <v-btn v-if="!applied" prepend-icon="mdi-key-outline" @click="reset">Reset password</v-btn>
    </div>
  </DialogShell>
</template>

<style scoped>
.reset__text { font-size: 14px; line-height: 20px; margin-bottom: 20px; }
.reset__password {
  display: flex; align-items: center; justify-content: space-between; height: 48px; padding: 0 16px;
  border-radius: 5px; background: rgb(var(--v-theme-canvas-table)); margin-bottom: 20px;
}
.reset__value { font-size: 16px; font-weight: 600; letter-spacing: 0.2px; }
.reset__copy { font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-primary)); border-radius: 5px; }
.reset__info {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 5px;
  background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); font-size: 14px; line-height: 20px;
}
.reset__actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
</style>
