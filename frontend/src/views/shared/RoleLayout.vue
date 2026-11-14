<script setup lang="ts">
import { computed } from 'vue'
import DesktopLayout from '@/layouts/DesktopLayout.vue'
import MobileLayout from '@/layouts/MobileLayout.vue'
import { useSessionStore } from '@/stores/session'

// Memilih rangka menurut peran: agent di HP, admin dan manager di desktop.
const session = useSessionStore()
const isAgent = computed(() => session.role === 'AGENT')
</script>

<template>
  <MobileLayout v-if="isAgent" />
  <DesktopLayout v-else />
</template>
