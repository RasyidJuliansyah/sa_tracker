<script setup lang="ts">
// Chip status/kategori (Figma: Chip). Tinggi 26px, pasangan -surface dan -text. Tidak bisa diklik.
export type ChipTone = 'neutral' | 'brand' | 'success' | 'error' | 'warning' | 'info' | 'accent'
defineProps<{ label: string; tone?: ChipTone }>()
</script>

<template>
  <span class="status-chip" :class="`status-chip--${tone ?? 'neutral'}`">{{ label }}</span>
</template>

<style scoped>
.status-chip {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  white-space: nowrap;
}
.status-chip--neutral { background: rgb(var(--v-theme-canvas-alt)); color: rgb(var(--v-theme-text-secondary)); }
.status-chip--brand { background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.status-chip--success { background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.status-chip--error { background: rgb(var(--v-theme-error-surface)); color: rgb(var(--v-theme-error)); }
.status-chip--warning { background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); }
.status-chip--info { background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); }
.status-chip--accent { background: rgb(var(--v-theme-accent-surface)); color: rgb(var(--v-theme-accent-text)); }
</style>
