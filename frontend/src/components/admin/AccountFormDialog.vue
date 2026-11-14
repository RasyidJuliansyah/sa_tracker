<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DialogShell from './DialogShell.vue'
import LabeledSelect from './LabeledSelect.vue'
import LabeledField from '@/components/LabeledField.vue'
import { emailExists, generateTempPassword, isValidEmail, type AccountInput } from '@/services/admin'
import type { MockAccount } from '@/mocks/admin'
import type { IndoTimezone } from '@/utils/timezone'

// Dialog tambah akun (Figma 25:338). Dengan prop `account`, dipakai sebagai ubah akun (tanpa password sementara).
const props = defineProps<{ account?: MockAccount | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ submit: [AccountInput]; toggleActive: [] }>()

const roleItems = [
  { title: 'Admin', value: 'ADMIN' }, { title: 'Manager', value: 'MANAGER' }, { title: 'Agent', value: 'AGENT' },
]
const zoneItems = ['WIB', 'WITA', 'WIT'].map((z) => ({ title: z, value: z }))

const name = ref('')
const email = ref('')
const role = ref<string | null>('AGENT')
const timezone = ref<string | null>('WIB')
const password = ref('')
const submitted = ref(false)
const isEdit = computed(() => !!props.account)

watch(open, (isOpen) => {
  if (!isOpen) return
  submitted.value = false
  name.value = props.account?.name ?? ''
  email.value = props.account?.email ?? ''
  role.value = props.account?.role ?? 'AGENT'
  timezone.value = props.account?.timezone ?? 'WIB'
  password.value = generateTempPassword()
})

const errors = computed(() => ({
  name: !name.value.trim() ? 'Nama wajib diisi' : '',
  email: !email.value.trim()
    ? 'Email kantor wajib diisi'
    : !isValidEmail(email.value.trim())
      ? 'Format email tidak valid'
      : emailExists(email.value, props.account?.id)
        ? 'Email sudah terdaftar'
        : '',
  role: !role.value ? 'Peran wajib dipilih' : '',
  timezone: !timezone.value ? 'Zona waktu wajib dipilih' : '',
}))
const shown = (key: keyof typeof errors.value) => (submitted.value ? errors.value[key] : '')

function submit() {
  submitted.value = true
  if (Object.values(errors.value).some(Boolean)) return
  emit('submit', {
    name: name.value, email: email.value, role: role.value as AccountInput['role'], timezone: timezone.value as IndoTimezone,
    password: isEdit.value ? undefined : password.value,
  })
  open.value = false
}
</script>

<template>
  <DialogShell v-model="open" :title="isEdit ? 'Ubah akun' : 'Tambah akun'" :subtitle="isEdit ? 'Perubahan dicatat di audit log' : 'Hanya admin yang bisa membuat akun'">
    <form class="form" novalidate @submit.prevent="submit">
      <LabeledField id="acc-name" v-model="name" label="Nama *" :error-messages="shown('name')" />
      <LabeledField id="acc-email" v-model="email" label="Email kantor *" type="email" append-inner-icon="mdi-email-outline" :error-messages="shown('email')" />
      <div class="form__row">
        <LabeledSelect id="acc-role" v-model="role" label="Peran *" :items="roleItems" :error-messages="shown('role')" />
        <LabeledSelect id="acc-tz" v-model="timezone" label="Zona waktu *" :items="zoneItems" :error-messages="shown('timezone')" />
      </div>
      <div v-if="!isEdit">
        <LabeledField id="acc-pass" v-model="password" label="Password sementara *" readonly>
          <template #append-inner>
            <button type="button" class="form__icon-btn" aria-label="Buat password baru" @click="password = generateTempPassword()">
              <v-icon icon="mdi-refresh" size="20" />
            </button>
          </template>
        </LabeledField>
        <p class="form__hint">Pengguna wajib mengganti password ini saat login pertama</p>
      </div>
      <div class="form__actions">
        <v-btn
          v-if="isEdit"
          class="form__toggle"
          variant="text"
          :color="account?.status === 'INACTIVE' ? 'primary' : 'error'"
          @click="emit('toggleActive'); open = false"
        >
          {{ account?.status === 'INACTIVE' ? 'Aktifkan akun' : 'Nonaktifkan akun' }}
        </v-btn>
        <v-spacer />
        <v-btn variant="outlined" @click="open = false">Batal</v-btn>
        <v-btn type="submit" prepend-icon="mdi-check">{{ isEdit ? 'Simpan' : 'Buat akun' }}</v-btn>
      </div>
    </form>
  </DialogShell>
</template>

<style scoped>
.form { display: flex; flex-direction: column; gap: 20px; }
.form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form__hint { margin-top: 6px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.form__actions { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 4px; }
.form__icon-btn { display: inline-flex; border-radius: 5px; color: rgb(var(--v-theme-text-secondary)); }
</style>
