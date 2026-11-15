<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/stores/session'

// Top bar HP (Figma: HP/Top bar). Tinggi 56px, tombol kembali opsional.
defineProps<{ title: string; back?: boolean }>()
const router = useRouter()
const session = useSessionStore()
</script>

<template>
  <v-app-bar class="mobile-bar" height="56">
    <div class="mobile-bar__inner">
      <button v-if="back" type="button" class="mobile-bar__back" aria-label="Kembali" @click="router.back()">
        <v-icon icon="mdi-chevron-left" size="24" />
      </button>
      <h1 class="mobile-bar__title">{{ title }}</h1>
      <v-menu location="bottom end">
        <template #activator="{ props: menu }">
          <button v-bind="menu" type="button" class="mobile-bar__account" aria-label="Menu akun" data-testid="menu-akun">
            <span class="mobile-bar__avatar" aria-hidden="true">{{ session.initials }}</span>
          </button>
        </template>
        <v-list density="compact">
          <v-list-item prepend-icon="mdi-logout" title="Keluar" data-testid="keluar" @click="session.logout()" />
        </v-list>
      </v-menu>
    </div>
  </v-app-bar>
</template>

<style scoped>
.mobile-bar__account { display: inline-flex; border-radius: 50%; }
.mobile-bar__inner {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 16px;
}
.mobile-bar__back {
  display: inline-flex;
  border-radius: 5px;
}
.mobile-bar__title {
  flex: 1;
  min-width: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}
.mobile-bar__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft));
  color: rgb(var(--v-theme-secondary));
  font-size: 13px;
  font-weight: 500;
}
</style>
