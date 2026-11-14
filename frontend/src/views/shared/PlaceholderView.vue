<script setup lang="ts">
import { useRoute } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'

// Penanda sementara untuk layar yang belum dibangun dari Figma. Diganti per layar.
const route = useRoute()
</script>

<template>
  <v-card>
    <EmptyState icon="mdi-shape-outline" :title="String(route.meta.title ?? 'Layar')" description="Layar ini belum dibangun dari desain Figma." />
  </v-card>
</template>
