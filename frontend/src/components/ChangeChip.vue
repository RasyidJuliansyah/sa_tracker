<script setup lang="ts">
import { computed } from 'vue'

// Chip perubahan angka (Figma: Chip perubahan). Selalu ada panah dan tanda + atau −, bukan warna saja.
const props = defineProps<{ direction: 'up' | 'down'; label: string }>()
const up = computed(() => props.direction === 'up')
</script>

<template>
  <span class="change-chip" :class="up ? 'change-chip--up' : 'change-chip--down'">
    <v-icon :icon="up ? 'mdi-arrow-up' : 'mdi-arrow-down'" size="14" />
    {{ label }}
  </span>
</template>

<style scoped>
.change-chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 24px;
  padding: 0 8px 0 6px;
  border-radius: 999px;
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  white-space: nowrap;
}
.change-chip--up {
  background: rgb(var(--v-theme-success-surface));
  color: rgb(var(--v-theme-success));
}
.change-chip--down {
  background: rgb(var(--v-theme-error-surface));
  color: rgb(var(--v-theme-error));
}
</style>
