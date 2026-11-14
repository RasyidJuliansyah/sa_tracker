<script setup lang="ts">
import logoIkon from '@/assets/brand/logo-ikon.svg'
import logoTeks from '@/assets/brand/logo-teks.svg'

// Logo Skolla berwarna. Rasio ikon 36,7 × 36,8 dan teks 123,6 × 36,8 dari Figma, diskalakan lewat tinggi.
const props = withDefaults(defineProps<{ height?: number }>(), { height: 27.491 })
const iconW = () => props.height * (36.7085 / 36.7991)
const textW = () => props.height * (123.559 / 36.799)
</script>

<template>
  <span class="brand-logo" :style="{ gap: `${height * 0.26}px` }" role="img" aria-label="Skolla">
    <img :src="logoIkon" alt="" :width="iconW()" :height="height" />
    <img :src="logoTeks" alt="" :width="textW()" :height="height" />
  </span>
</template>

<style scoped>
.brand-logo {
  display: inline-flex;
  align-items: flex-start;
}
</style>
