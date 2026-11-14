<script setup lang="ts">
import ChangeChip from './ChangeChip.vue'

// Kartu angka ringkas (Figma: StatCard). Data kosong ditulis "–", bukan 0.
export type StatTone = 'brand' | 'success' | 'warning' | 'info' | 'accent'
defineProps<{
  label: string
  value: string | null
  icon: string
  tone?: StatTone
  change?: { direction: 'up' | 'down'; label: string }
  comparison?: string
}>()
</script>

<template>
  <v-card class="stat-card">
    <div class="stat-card__tile" :class="`stat-card__tile--${tone ?? 'brand'}`">
      <v-icon :icon="icon" size="22" />
    </div>
    <div class="stat-card__body">
      <p class="stat-card__label">{{ label }}</p>
      <p class="stat-card__value">{{ value ?? '–' }}</p>
      <div v-if="change" class="stat-card__change">
        <ChangeChip :direction="change.direction" :label="change.label" />
        <span v-if="comparison" class="stat-card__comparison">{{ comparison }}</span>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.stat-card {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 20px;
}
.stat-card__tile {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 8px;
}
.stat-card__tile--brand { background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.stat-card__tile--success { background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.stat-card__tile--warning { background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); }
.stat-card__tile--info { background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); }
.stat-card__tile--accent { background: rgb(var(--v-theme-accent-surface)); color: rgb(var(--v-theme-accent-text)); }
.stat-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
}
.stat-card__label {
  font-size: 12px;
  line-height: 16px;
  color: rgb(var(--v-theme-text-secondary));
}
.stat-card__value {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
}
.stat-card__change {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
}
.stat-card__comparison {
  font-size: 12px;
  line-height: 16px;
  color: rgb(var(--v-theme-text-secondary));
  white-space: nowrap;
}
</style>
