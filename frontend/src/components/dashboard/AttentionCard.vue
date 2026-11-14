<script setup lang="ts">
import { computed } from 'vue'
import StatusChip from '@/components/StatusChip.vue'
import type { AttentionItem } from '@/mocks/dashboard'

// Kontrak yang perlu perhatian: sudah lewat tanggal berakhir tanpa perpanjangan, dan yang berakhir dalam 60 hari.
const props = defineProps<{ items: AttentionItem[] }>()
const lapsed = computed(() => props.items.filter((i) => i.kind === 'lapsed'))
const soon = computed(() => props.items.filter((i) => i.kind === 'soon'))
</script>

<template>
  <v-card class="att">
    <header class="att__head">
      <h2 class="att__title">Perlu perhatian</h2>
      <StatusChip :label="`${items.length} kontrak`" tone="warning" />
    </header>
    <template v-for="group in [{ title: 'Berakhir tahun ini, belum diperpanjang', rows: lapsed, tone: 'error' as const }, { title: 'Akan berakhir dalam 60 hari', rows: soon, tone: 'warning' as const }]" :key="group.title">
      <h3 v-if="group.rows.length" class="att__group">{{ group.title }}</h3>
      <ul class="att__list">
        <li v-for="i in group.rows" :key="i.school + i.badge" class="att__item">
          <div>
            <p class="att__school">{{ i.school }}</p>
            <p class="att__meta">{{ i.agent }} • berakhir {{ i.endLabel }} • {{ i.valueLabel }}</p>
          </div>
          <StatusChip :label="i.badge" :tone="group.tone" />
        </li>
      </ul>
    </template>
    <p v-if="!items.length" class="att__meta">Tidak ada kontrak yang perlu perhatian untuk agent terpilih.</p>
  </v-card>
</template>

<style scoped>
.att { display: flex; flex-direction: column; gap: 12px; padding: 24px; height: 100%; }
.att__head { display: flex; align-items: center; justify-content: space-between; }
.att__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.att__group { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); margin-top: 4px; }
.att__list { list-style: none; margin: 0; padding: 0; }
.att__item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); }
.att__item:last-child { border-bottom: 0; }
.att__school { font-size: 14px; line-height: 20px; font-weight: 500; }
.att__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
</style>
