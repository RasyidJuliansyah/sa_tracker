<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/services/http'
import { homeFor, useSessionStore } from '@/stores/session'
import LabeledField from '@/components/LabeledField.vue'
import logoIkon from '@/assets/brand/logo-ikon.svg'
import logoPutih from '@/assets/login/logo-skolla-putih.png'
import logoTeks from '@/assets/brand/logo-teks.svg'

// Desain: Figma "SA" → 01 Umum → Login (Desktop, Galat, HP).
const highlights = [
  { icon: 'mdi-map-marker-check-outline', text: 'Check-in dengan foto dan lokasi GPS' },
  { icon: 'mdi-clipboard-text-outline', text: 'Laporan kunjungan wajib saat check-out' },
  { icon: 'mdi-target', text: 'Pantau retention dan target tahunan' },
]

const router = useRouter()
const session = useSessionStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const formError = ref('')
const passwordError = ref('')
const emailError = ref('')

const passwordType = computed(() => (showPassword.value ? 'text' : 'password'))

function validate(): boolean {
  emailError.value = ''
  passwordError.value = ''
  formError.value = ''
  if (!email.value.trim()) emailError.value = 'Email kantor wajib diisi'
  else if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) emailError.value = 'Format email tidak valid'
  if (!password.value) passwordError.value = 'Password wajib diisi'
  return !emailError.value && !passwordError.value
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  try {
    await session.login(email.value.trim(), password.value)
    await router.replace(homeFor(session.role))
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      formError.value = 'Email atau password salah, atau akun sudah dinonaktifkan. Hubungi admin jika perlu bantuan.'
      passwordError.value = 'Periksa kembali password Anda'
    } else {
      formError.value = e instanceof ApiError ? e.message : 'Terjadi kesalahan. Coba lagi.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <aside class="login__brand" aria-label="Tentang aplikasi">
      <div class="login__brand-top">
        <div class="login__logo-crop">
          <img :src="logoPutih" alt="Skolla" class="login__logo-img" />
        </div>
        <p class="login__app-name">Service Account Visit Tracker</p>
      </div>
      <div class="login__brand-middle">
        <p class="login__headline">Catat setiap kunjungan sekolah, dari check-in sampai laporan.</p>
        <div v-for="item in highlights" :key="item.icon" class="login__highlight">
          <span class="login__highlight-icon"><v-icon :icon="item.icon" size="20" /></span>
          <span class="login__highlight-text">{{ item.text }}</span>
        </div>
      </div>
      <p class="login__brand-footer">Untuk tim service account Skolla</p>
    </aside>

    <main class="login__main">
      <header class="login__mobile-brand">
        <div class="login__mobile-logo">
          <img :src="logoIkon" alt="" width="36.7085" height="36.7991" />
          <img :src="logoTeks" alt="Skolla" width="123.559" height="36.799" />
        </div>
        <div>
          <p class="login__mobile-title">Visit Tracker</p>
          <p class="login__mobile-subtitle">Service account Skolla</p>
        </div>
      </header>

      <v-card class="login__card" data-testid="login-card">
        <form class="login__form" novalidate @submit.prevent="onSubmit">
          <div class="login__heading">
            <h1 class="login__title">Masuk</h1>
            <p class="login__subtitle">Gunakan email kantor yang sudah didaftarkan admin.</p>
          </div>

          <div v-if="formError" class="login__alert" role="alert" data-testid="login-alert">
            <v-icon icon="mdi-alert-circle-outline" size="20" />
            <p>{{ formError }}</p>
          </div>

          <LabeledField
            id="login-email"
            v-model="email"
            label="Email kantor"
            type="email"
            autocomplete="username"
            placeholder="nama@skolla.id"
            :error-messages="emailError"
            append-inner-icon="mdi-email-outline"
          />

          <LabeledField
            id="login-password"
            v-model="password"
            label="Password"
            :type="passwordType"
            autocomplete="current-password"
            placeholder="Masukkan password"
            :error-messages="passwordError"
          >
            <template #append-inner>
              <button
                type="button"
                class="login__eye"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <v-icon :icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" size="20" />
              </button>
            </template>
          </LabeledField>

          <v-btn type="submit" block height="40" prepend-icon="mdi-login" :loading="loading" data-testid="login-submit">
            Masuk
          </v-btn>

          <p class="login__hint">
            <v-icon icon="mdi-information-outline" size="16" />
            Lupa password? Minta admin untuk reset.
          </p>
        </form>
      </v-card>
    </main>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

/* Panel merek (desktop) */
.login__brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 0 0 600px;
  padding: 64px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.login__brand-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.login__logo-crop {
  position: relative;
  width: 210px;
  height: 45px;
  overflow: hidden;
}
/* Gambar logo punya ruang kosong; dipotong seperti di Figma */
.login__logo-img {
  position: absolute;
  max-width: none;
  width: 135.49%;
  height: 187.96%;
  left: -17.75%;
  top: -44.62%;
}
.login__app-name {
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
}
.login__brand-middle {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.login__headline {
  width: 420px;
  max-width: 100%;
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
}
.login__highlight {
  display: flex;
  align-items: center;
  gap: 12px;
}
.login__highlight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgb(var(--v-theme-secondary));
}
.login__highlight-text {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}
.login__brand-footer {
  font-size: 12px;
  line-height: 16px;
}

/* Area form */
.login__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
}
.login__mobile-brand {
  display: none;
}
.login__card {
  width: 482px;
  max-width: 100%;
  padding: 40px;
}
.login__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.login__heading {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.login__title {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}
.login__subtitle {
  font-size: 14px;
  line-height: 20px;
  color: rgb(var(--v-theme-text-secondary));
}
.login__alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 20px;
  color: rgb(var(--v-theme-error));
  background: rgb(var(--v-theme-error-surface));
  border-radius: 8px;
}
.login__eye {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  color: rgb(var(--v-theme-text-secondary));
  cursor: pointer;
}
.login__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 16px;
  color: rgb(var(--v-theme-text-secondary));
}

/* HP: tanpa panel merek, satu kolom di atas latar putih */
@media (max-width: 959px) {
  .login {
    background: rgb(var(--v-theme-surface));
  }
  .login__brand {
    display: none;
  }
  .login__main {
    justify-content: flex-start;
    align-items: stretch;
    gap: 32px;
    padding: 48px 24px 32px;
  }
  .login__mobile-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .login__mobile-logo {
    display: flex;
    align-items: flex-start;
    gap: 9.7px;
  }
  .login__mobile-title,
  .login__mobile-subtitle {
    text-align: center;
  }
  .login__mobile-title {
    font-size: 16px;
    line-height: 24px;
    font-weight: 600;
    color: rgb(var(--v-theme-secondary));
  }
  .login__mobile-subtitle {
    font-size: 12px;
    line-height: 16px;
    color: rgb(var(--v-theme-text-secondary));
  }
  .login__card {
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
  }
}
</style>
