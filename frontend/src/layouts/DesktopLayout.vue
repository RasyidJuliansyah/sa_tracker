<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopBar from '@/components/layout/AppTopBar.vue'
import { useSessionStore } from '@/stores/session'
import { sidebarItems } from '@/utils/navigation'

// Rangka admin dan manager: sidebar 220px + app bar 70px + konten di atas latar canvas.
const route = useRoute()
const session = useSessionStore()
const items = computed(() => sidebarItems[session.role === 'ADMIN' ? 'ADMIN' : 'MANAGER'])
const title = computed(() => String(route.meta.title ?? ''))
</script>

<template>
  <AppSidebar :items="items" />
  <AppTopBar :title="title" />
  <v-main class="desktop-main">
    <div class="desktop-main__content"><router-view /></div>
  </v-main>
</template>

<style scoped>
.desktop-main {
  background: rgb(var(--v-theme-background));
}
.desktop-main__content {
  padding: 32px;
}
</style>
