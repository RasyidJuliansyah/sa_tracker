<script setup lang="ts">
// Bilah progres retention dengan penanda target. Isian tidak dibatasi 100% di data, tetapi digambar maksimal penuh.
withDefaults(defineProps<{ percent: number; target: number; color?: string; height?: number }>(), { color: 'primary', height: 10 })
</script>

<template>
  <div class="target-bar" :style="{ height: `${height}px` }" role="img" :aria-label="`${percent}% dari target ${target}%`">
    <div class="target-bar__fill" :style="{ width: `${Math.min(percent, 100)}%`, background: `rgb(var(--v-theme-${color}))` }" />
    <span class="target-bar__mark" :style="{ left: `${target}%`, height: `${height + 8}px` }" />
  </div>
</template>

<style scoped>
.target-bar { position: relative; border-radius: 999px; background: rgb(var(--v-theme-canvas-alt)); }
.target-bar__fill { height: 100%; border-radius: 999px; }
.target-bar__mark { position: absolute; top: -4px; width: 2px; background: rgb(var(--v-theme-on-surface)); }
</style>
