<script setup lang="ts">
// Bilah aksi bawah (Figma: Aksi bawah): tombol pill penuh, tinggi 44px (target sentuh), menempel di bawah layar.
defineProps<{ label: string; icon: string; disabled?: boolean; loading?: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <div class="bottom-action">
    <v-btn block rounded="pill" color="primary" height="44" :prepend-icon="icon" :disabled="disabled" :loading="loading" @click="$emit('click')">{{ label }}</v-btn>
  </div>
</template>

<style scoped>
.bottom-action {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  padding: 16px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgb(var(--v-theme-border));
}
</style>
