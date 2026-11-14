<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { visitMinutes } from '@/components/agent/visit-format'
import { useAgentVisitsStore } from '@/stores/agent-visits'
import { formatDuration } from '@/utils/format'
import { IANA_ZONE, formatClock } from '@/utils/timezone'

const router = useRouter()
const store = useAgentVisitsStore()
const visit = store.lastCompleted
// Tanpa kunjungan yang baru selesai (mis. halaman dimuat ulang), kembali ke Beranda.
onMounted(() => !visit && router.replace('/agent'))
const rows = visit
  ? [
      ['Sekolah', visit.schoolName],
      ['Tanggal', new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: IANA_ZONE.WIB }).format(new Date(visit.checkInAt))],
      ['Check-in', formatClock(visit.checkInAt, visit.timezone)],
      ['Check-out', formatClock(visit.checkOutAt ?? store.now, visit.timezone)],
      ['Durasi', formatDuration(visitMinutes(visit, store.now))],
    ]
  : []
</script>

<template>
  <div v-if="visit" class="done">
    <div class="hero">
      <div class="hero__circle"><v-icon icon="mdi-check-circle-outline" size="40" /></div>
      <h2 class="hero__title">Kunjungan selesai</h2>
      <p class="hero__text">Laporan sudah tersimpan dan bisa dilihat manager.</p>
    </div>
    <v-card class="summary">
      <h3 class="summary__title">Ringkasan</h3>
      <dl class="summary__list">
        <div v-for="([k, v], i) in rows" :key="k" class="summary__row" :class="{ 'summary__row--last': i === rows.length - 1 }">
          <dt>{{ k }}</dt>
          <dd>{{ v }}</dd>
        </div>
      </dl>
    </v-card>
    <div class="actions">
      <v-btn block rounded="pill" color="primary" height="44" to="/agent">Kembali ke beranda</v-btn>
      <v-btn block rounded="pill" variant="outlined" color="primary" class="bg-surface" height="44" to="/agent/riwayat">Lihat riwayat</v-btn>
    </div>
  </div>
</template>

<style scoped>
.done { display: flex; flex-direction: column; gap: 16px; padding-bottom: 120px; }
.hero { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 32px 0 8px; }
.hero__circle { display: flex; align-items: center; justify-content: center; width: 72px; height: 72px; border-radius: 999px; background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.hero__title { font-size: 20px; line-height: 28px; font-weight: 600; }
.hero__text { font-size: 14px; line-height: 20px; text-align: center; color: rgb(var(--v-theme-text-secondary)); }
.summary { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.summary__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.summary__list { display: flex; flex-direction: column; gap: 12px; }
.summary__row { display: flex; gap: 12px; padding: 8px 0; font-size: 14px; line-height: 20px; border-bottom: 1px solid rgb(var(--v-theme-border)); }
.summary__row dt { flex: none; width: 130px; color: rgb(var(--v-theme-text-secondary)); }
.summary__row dd { flex: 1; min-width: 0; font-weight: 500; }
.actions { position: fixed; right: 0; bottom: 0; left: 0; z-index: 1000; display: flex; flex-direction: column; gap: 8px; padding: 16px; background: rgb(var(--v-theme-surface)); border-top: 1px solid rgb(var(--v-theme-border)); }
</style>
