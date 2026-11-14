<script setup lang="ts">
// Daftar label-nilai (label 130px secondary, nilai bobot 500), garis pemisah di bawah tiap baris.
defineProps<{ rows: [string, string][] }>()
</script>

<template>
  <dl class="rows">
    <div v-for="[label, value] in rows" :key="label" class="rows__row">
      <dt>{{ label }}</dt>
      <dd>{{ value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.rows { display: flex; flex-direction: column; gap: 12px; }
.rows__row { display: flex; gap: 12px; padding: 8px 0; font-size: 14px; line-height: 20px; border-bottom: 1px solid rgb(var(--v-theme-border)); }
.rows__row dt { flex: none; width: 130px; color: rgb(var(--v-theme-text-secondary)); }
.rows__row dd { flex: 1; min-width: 0; font-weight: 500; }
</style>
