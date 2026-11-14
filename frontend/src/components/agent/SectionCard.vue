<script setup lang="ts">
// Kartu bagian layar agent: judul 16px, subjudul 12px, slot aksi di kanan header, isi di bawah.
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <v-card class="section-card">
    <header class="section-card__header">
      <div>
        <h2 class="section-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="section-card__subtitle">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </v-card>
</template>

<style scoped>
.section-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}
.section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.section-card__title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
}
.section-card__subtitle {
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  color: rgb(var(--v-theme-text-secondary));
}
</style>
