<script setup lang="ts">
// Keadaan kosong (Figma: EmptyState). Ikon di lingkaran accent-surface 72px.
withDefaults(defineProps<{ title: string; description: string; icon?: string }>(), { icon: 'mdi-clipboard-text-outline' })
</script>

<template>
  <div class="empty-state">
    <div class="empty-state__circle"><v-icon :icon="icon" size="32" /></div>
    <p class="empty-state__title">{{ title }}</p>
    <p class="empty-state__description">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
}
.empty-state__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: rgb(var(--v-theme-accent-surface));
  color: rgb(var(--v-theme-accent-text));
}
.empty-state__title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}
.empty-state__description {
  width: 320px;
  max-width: 100%;
  text-align: center;
  font-size: 14px;
  line-height: 20px;
  color: rgb(var(--v-theme-text-secondary));
}
</style>
