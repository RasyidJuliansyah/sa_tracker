<script setup lang="ts">
// Baris daftar: ubin ikon 36px (opsional), dua baris teks, slot isi tambahan, dan panah ke kanan bila bisa dibuka.
import type { StatTone } from '@/components/StatCard.vue'
withDefaults(defineProps<{ title: string; subtitle?: string; icon?: string; tone?: StatTone | 'error'; to?: string; last?: boolean }>(), { tone: 'brand' })
</script>

<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" class="icon-row" :class="{ 'icon-row--last': last }">
    <div v-if="icon" class="icon-row__tile" :class="`icon-row__tile--${tone}`"><v-icon :icon="icon" size="20" /></div>
    <div class="icon-row__body">
      <p class="icon-row__title">{{ title }}</p>
      <p v-if="subtitle" class="icon-row__subtitle">{{ subtitle }}</p>
      <slot />
    </div>
    <slot name="end" />
    <v-icon v-if="to" icon="mdi-chevron-right" size="20" class="icon-row__chevron" />
  </component>
</template>

<style scoped>
.icon-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  min-height: 44px;
  border-bottom: 1px solid rgb(var(--v-theme-border));
  color: inherit;
  text-decoration: none;
}
.icon-row--last { border-bottom: 0; }
.icon-row__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
}
.icon-row__tile--brand { background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.icon-row__tile--error { background: rgb(var(--v-theme-error-surface)); color: rgb(var(--v-theme-error)); }
.icon-row__tile--warning { background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); }
.icon-row__tile--success { background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.icon-row__tile--info { background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); }
.icon-row__tile--accent { background: rgb(var(--v-theme-accent-surface)); color: rgb(var(--v-theme-accent-text)); }
.icon-row__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.icon-row__title { font-size: 14px; line-height: 20px; font-weight: 500; }
.icon-row__subtitle { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.icon-row__chevron { flex: none; color: rgb(var(--v-theme-text-secondary)); }
</style>
