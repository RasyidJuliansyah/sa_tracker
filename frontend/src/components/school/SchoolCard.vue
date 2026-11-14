<script setup lang="ts">
// Kartu bagian layar sekolah: padding 24, judul 16px bobot 600, subjudul 12px, slot aksi di kanan judul.
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <v-card class="school-card">
    <header class="school-card__head">
      <div>
        <h2 class="school-card__title">{{ title }}</h2>
        <p v-if="subtitle" class="school-card__subtitle">{{ subtitle }}</p>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </v-card>
</template>

<style scoped>
.school-card { padding: 24px; }
.school-card__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.school-card__head:has(+ *) { margin-bottom: 16px; }
.school-card__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.school-card__subtitle { margin-top: 2px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
</style>
