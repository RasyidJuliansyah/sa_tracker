<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'
import MobileTopBar from '@/components/layout/MobileTopBar.vue'

// Rangka agent di HP: top bar 56px + navigasi bawah 64px. route.meta.back menampilkan tombol kembali,
// route.meta.hideNav menyembunyikan navigasi bawah (mis. saat alur check-in).
const route = useRoute()
const title = computed(() => String(route.meta.title ?? ''))
</script>

<template>
  <MobileTopBar :title="title" :back="Boolean(route.meta.back)" />
  <v-main class="mobile-main">
    <div class="mobile-main__content" :class="{ 'mobile-main__content--nav': !route.meta.hideNav }"><router-view /></div>
  </v-main>
  <MobileBottomNav v-if="!route.meta.hideNav" />
</template>

<style scoped>
.mobile-main {
  background: rgb(var(--v-theme-background));
}
.mobile-main__content {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
.mobile-main__content--nav {
  padding-bottom: 80px;
}
</style>
