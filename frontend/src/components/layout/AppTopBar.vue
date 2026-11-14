<script setup lang="ts">
import { useSessionStore } from '@/stores/session'

// App bar desktop (Figma: App bar). Tinggi 70px.
defineProps<{ title: string }>()
const session = useSessionStore()
</script>

<template>
  <v-app-bar class="app-bar">
    <div class="app-bar__inner">
      <h1 class="app-bar__title">{{ title }}</h1>
      <div class="app-bar__right">
        <button type="button" class="app-bar__bell" aria-label="Notifikasi"><v-icon icon="mdi-bell-outline" size="22" /></button>
        <span class="app-bar__divider" aria-hidden="true" />
        <span class="app-bar__avatar" aria-hidden="true">{{ session.initials }}</span>
        <div class="app-bar__user">
          <p class="app-bar__name">{{ session.name }}</p>
          <p class="app-bar__role">{{ session.roleLabel }}</p>
        </div>
        <v-icon icon="mdi-chevron-down" size="20" />
      </div>
    </div>
  </v-app-bar>
</template>

<style scoped>
.app-bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 32px;
}
.app-bar__title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
}
.app-bar__right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.app-bar__bell {
  display: inline-flex;
  border-radius: 5px;
  color: rgb(var(--v-theme-text-secondary));
}
.app-bar__divider {
  width: 1px;
  height: 32px;
  background: rgb(var(--v-theme-border));
}
.app-bar__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft));
  color: rgb(var(--v-theme-secondary));
  font-size: 13px;
  font-weight: 500;
}
.app-bar__name {
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}
.app-bar__role {
  font-size: 12px;
  line-height: 16px;
  color: rgb(var(--v-theme-text-secondary));
}
</style>
