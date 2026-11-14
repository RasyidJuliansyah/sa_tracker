<script setup lang="ts">
import StatusChip from '@/components/StatusChip.vue'
import type { UnvisitedSchool } from '@/mocks/dashboard'

// Sekolah yang ditugaskan tetapi belum dikunjungi pada periode terpilih.
defineProps<{ schools: UnvisitedSchool[]; periodLabel: string }>()
</script>

<template>
  <v-card class="unv">
    <header class="unv__head">
      <div>
        <h2 class="unv__title">Sekolah ditugaskan, belum dikunjungi</h2>
        <p class="unv__sub">Periode {{ periodLabel }}</p>
      </div>
      <StatusChip :label="`${schools.length} sekolah`" tone="warning" />
    </header>
    <ul class="unv__grid">
      <li v-for="s in schools" :key="s.name" class="unv__tile">
        <span class="unv__icon"><v-icon icon="mdi-school-outline" size="20" /></span>
        <div>
          <p class="unv__name">{{ s.name }}</p>
          <p class="unv__meta">{{ s.agent }} • {{ s.lastLabel }}</p>
        </div>
      </li>
    </ul>
    <p v-if="!schools.length" class="unv__meta">Semua sekolah yang ditugaskan sudah dikunjungi.</p>
  </v-card>
</template>

<style scoped>
.unv { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.unv__head { display: flex; align-items: flex-start; justify-content: space-between; }
.unv__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.unv__sub, .unv__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.unv__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; list-style: none; margin: 0; padding: 0; }
.unv__tile { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; background: rgb(var(--v-theme-canvas-table)); }
.unv__icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); flex: none; }
.unv__name { font-size: 14px; line-height: 20px; font-weight: 500; }
</style>
