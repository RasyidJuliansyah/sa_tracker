<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import StatusChip from '@/components/StatusChip.vue'
import { fetchImageUrl } from '@/services/http'
import { getVisit, googleMapsUrl, type VisitRow } from '@/services/manager'
import { MOCK_AUTH } from '@/stores/session'
import { formatDateLong, formatDuration } from '@/utils/format'
import { formatClock } from '@/utils/timezone'

// Manager – Detail kunjungan (Figma 20:576). Foto masih placeholder; lokasi check-in berupa tautan Google Maps.
const route = useRoute()
const visit = ref<VisitRow | null>(null)
const loaded = ref(false)
const photoUrl = ref<string | null>(null)
onBeforeUnmount(() => photoUrl.value && URL.revokeObjectURL(photoUrl.value))

watch(() => route.params.id, async (id) => {
  loaded.value = false
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photoUrl.value = null
  visit.value = await getVisit(Number(id))
  loaded.value = true
  if (visit.value && !MOCK_AUTH) photoUrl.value = await fetchImageUrl(`/visits/${visit.value.id}/photo`)
}, { immediate: true })

const initials = (name: string) => name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
const rows = computed(() => {
  const v = visit.value
  if (!v) return []
  return [
    { label: 'Check-in', value: formatClock(v.checkInAt, v.timezone) },
    { label: 'Check-out', value: v.checkOutAt ? formatClock(v.checkOutAt, v.timezone) : 'Belum check-out' },
    { label: 'Durasi', value: formatDuration(v.durationMinutes) },
    { label: 'Akurasi GPS', value: `±${v.accuracyM} m` },
  ]
})
</script>

<template>
  <div v-if="visit" class="detail">
    <nav class="detail__crumb" aria-label="Jejak halaman">
      <router-link :to="{ name: 'rekap' }" class="detail__crumb-link">Rekap kunjungan</router-link>
      <v-icon icon="mdi-chevron-right" size="16" />
      <span class="detail__crumb-current">{{ visit.schoolName }} · {{ visit.dateLabel }}</span>
    </nav>

    <div class="detail__title-row">
      <div class="detail__title-block">
        <h2 class="detail__title">{{ visit.schoolName }}</h2>
        <p class="detail__sub">Kunjungan {{ visit.agentName }} · {{ formatDateLong(visit.checkInAt) }}</p>
      </div>
      <StatusChip :label="visit.status === 'ONGOING' ? 'Berlangsung' : 'Selesai'" :tone="visit.status === 'ONGOING' ? 'info' : 'success'" />
      <StatusChip :label="visit.assigned ? 'Sekolah ditugaskan' : 'Tidak ditugaskan'" :tone="visit.assigned ? 'brand' : 'neutral'" />
    </div>

    <div class="detail__body">
      <div class="detail__main">
        <v-card class="detail__card">
          <header class="detail__head">
            <h3 class="detail__h3">Laporan kunjungan</h3>
            <p v-if="visit.checkOutAt" class="detail__caption">Ditulis saat check-out {{ formatClock(visit.checkOutAt, visit.timezone) }}</p>
          </header>
          <p v-if="visit.report" class="detail__report">{{ visit.report }}</p>
          <p v-else class="detail__report detail__report--empty">Laporan tersedia setelah agent check-out.</p>
        </v-card>

        <v-card class="detail__card">
          <header class="detail__head">
            <h3 class="detail__h3">Foto check-in</h3>
            <p class="detail__caption">Diambil {{ formatClock(visit.checkInAt, visit.timezone) }} · dikompres sebelum diunggah</p>
          </header>
          <img v-if="photoUrl" :src="photoUrl" alt="Foto bukti kunjungan" class="detail__photo detail__photo--img" />
          <div v-else class="detail__photo" role="img" aria-label="Foto bukti kunjungan (placeholder)">
            <v-icon icon="mdi-image-outline" size="48" class="detail__photo-icon" />
            <span class="detail__photo-text">Foto bukti kunjungan</span>
          </div>
        </v-card>
      </div>

      <v-card class="detail__card detail__info">
        <h3 class="detail__h3">Informasi kunjungan</h3>
        <div class="detail__row">
          <span class="detail__key">Agent</span>
          <span class="detail__agent">
            <span class="detail__avatar">{{ initials(visit.agentName) }}</span>
            <span class="detail__val">{{ visit.agentName }}</span>
          </span>
        </div>
        <div class="detail__row">
          <span class="detail__key">Zona agent</span>
          <span class="detail__val">{{ visit.timezone }}</span>
        </div>
        <div class="detail__row">
          <span class="detail__key">Sekolah</span>
          <span class="detail__val detail__val--brand">{{ visit.schoolName }}</span>
        </div>
        <div v-for="r in rows" :key="r.label" class="detail__row">
          <span class="detail__key">{{ r.label }}</span>
          <span class="detail__val">{{ r.value }}</span>
        </div>
        <div class="detail__row detail__row--last">
          <span class="detail__key">Lokasi check-in</span>
          <a class="detail__maps" :href="googleMapsUrl(visit.lat, visit.lng)" target="_blank" rel="noopener noreferrer">
            Buka di Google Maps
            <v-icon icon="mdi-open-in-new" size="16" />
          </a>
        </div>
      </v-card>
    </div>
  </div>

  <v-card v-else-if="loaded">
    <EmptyState title="Kunjungan tidak ditemukan" description="Kunjungan ini tidak ada atau sudah tidak bisa diakses." icon="mdi-clipboard-search-outline">
      <v-btn :to="{ name: 'rekap' }" variant="outlined">Kembali ke rekap</v-btn>
    </EmptyState>
  </v-card>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 24px; }
.detail__crumb { display: flex; align-items: center; gap: 6px; font-size: 13px; line-height: 18px; font-weight: 500; }
.detail__crumb-link { color: rgb(var(--v-theme-primary)); text-decoration: none; border-radius: 5px; }
.detail__crumb-link:hover { text-decoration: underline; }
.detail__crumb-current { color: rgb(var(--v-theme-text-secondary)); }
.detail__title-row { display: flex; align-items: center; gap: 16px; }
.detail__title-block { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.detail__title { font-size: 24px; line-height: 32px; font-weight: 600; }
.detail__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.detail__body { display: flex; align-items: flex-start; gap: 24px; }
.detail__main { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 24px; }
.detail__card { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.detail__info { width: 420px; flex: none; gap: 4px; }
.detail__head { display: flex; flex-direction: column; gap: 2px; }
.detail__h3 { font-size: 16px; line-height: 24px; font-weight: 600; }
.detail__caption { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.detail__report { font-size: 14px; line-height: 20px; }
.detail__report--empty { color: rgb(var(--v-theme-text-secondary)); }
.detail__photo {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; height: 380px; border-radius: 8px;
  background: rgb(var(--v-theme-canvas-alt));
}
.detail__photo--img { width: 100%; object-fit: contain; background: rgb(var(--v-theme-canvas-table, 245 245 247)); }
.detail__photo-icon, .detail__photo-text { color: rgb(var(--v-theme-text-secondary)); }
.detail__photo-text { font-size: 13px; line-height: 18px; font-weight: 500; }
.detail__row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); font-size: 14px; line-height: 20px; }
.detail__row--last { border-bottom: 0; }
.detail__key { flex: none; width: 140px; color: rgb(var(--v-theme-text-secondary)); }
.detail__val { font-weight: 500; }
.detail__val--brand { color: rgb(var(--v-theme-primary)); }
.detail__agent { display: flex; align-items: center; gap: 8px; }
.detail__avatar {
  display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft)); color: rgb(var(--v-theme-secondary)); font-size: 13px; font-weight: 500;
}
.detail__maps { display: inline-flex; align-items: center; gap: 6px; color: rgb(var(--v-theme-primary)); font-weight: 500; text-decoration: none; border-radius: 5px; }
.detail__maps:hover { text-decoration: underline; }
</style>
