<script setup lang="ts">
import { computed, ref } from 'vue'
import StatusChip from '@/components/StatusChip.vue'
import SectionCard from './SectionCard.vue'
import { formatCoordinates } from './visit-rules'
import type { LocationFix } from './geolocation'
import type { LocationState, SchoolLite } from './visit-rules'

// Langkah 2: foto bukti (kamera belakang) dan lokasi GPS. Tombol aksi ada di halaman induk.
const props = defineProps<{ school: SchoolLite; location: LocationFix | null; locationState: LocationState; photoUrl: string | null; photoTime: string | null; error: string | null }>()
const emit = defineEmits<{ change: []; photo: [file: File] }>()
const input = ref<HTMLInputElement | null>(null)

const locationView = computed(() => {
  switch (props.locationState) {
    case 'ok':
      return { chip: `Akurasi ±${Math.round(props.location?.accuracy ?? 0)} m`, tone: 'success' as const, title: 'Lokasi terdeteksi', text: props.location ? formatCoordinates(props.location.lat, props.location.lng) : '' }
    case 'denied':
      return { chip: 'Tidak tersedia', tone: 'error' as const, title: 'Izin lokasi ditolak', text: 'Buka pengaturan browser, izinkan lokasi untuk situs ini, lalu ketuk Coba lagi.' }
    case 'unavailable':
      return { chip: 'Tidak tersedia', tone: 'error' as const, title: 'Lokasi tidak tersedia', text: 'Perangkat atau browser tidak mendukung lokasi, atau situs tidak dibuka lewat HTTPS. Ketuk Coba lagi.' }
    case 'timeout':
      return { chip: 'Waktu habis', tone: 'error' as const, title: 'Lokasi belum didapat', text: 'Pastikan GPS aktif dan sinyal baik, lalu ketuk Coba lagi.' }
    default:
      return { chip: 'Mencari…', tone: 'neutral' as const, title: 'Mencari lokasi', text: 'Menunggu GPS perangkat. Izinkan akses lokasi bila diminta.' }
  }
})
const failed = computed(() => ['denied', 'unavailable', 'timeout'].includes(props.locationState))
const noPhotoError = computed(() => Boolean(props.error) && !props.photoUrl)

function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('photo', file)
}
</script>

<template>
  <v-card class="school-card">
    <div class="school-card__tile"><v-icon icon="mdi-school-outline" size="22" /></div>
    <div class="school-card__body">
      <p class="school-card__name">{{ school.name }}</p>
      <p class="school-card__meta">NPSN {{ school.npsn }}{{ school.assigned ? ' · ditugaskan kepada Anda' : '' }}</p>
    </div>
    <button type="button" class="school-card__change" @click="emit('change')">Ganti</button>
  </v-card>

  <div v-if="error" class="alert alert--error" role="alert">
    <v-icon icon="mdi-alert-circle-outline" size="20" />
    <p>{{ error }}</p>
  </div>

  <div>
    <h2 class="title">Foto</h2>
    <p class="sub">Wajib. Kamera belakang akan terbuka.</p>
  </div>
  <input ref="input" class="sr-only" type="file" accept="image/*" capture="environment" data-testid="foto-input" aria-label="Ambil foto bukti kunjungan" @change="onFile" />
  <button type="button" class="photo" :class="{ 'photo--error': noPhotoError, 'photo--filled': photoUrl }" @click="input?.click()">
    <img v-if="photoUrl" :src="photoUrl" alt="Pratinjau foto bukti kunjungan" class="photo__img" />
    <template v-else>
      <v-icon :icon="noPhotoError ? 'mdi-camera-outline' : 'mdi-image-outline'" size="40" />
      <span class="photo__title">{{ noPhotoError ? 'Belum ada foto' : 'Ambil foto bukti kunjungan' }}</span>
      <span class="sub">Ketuk untuk membuka kamera</span>
    </template>
    <span v-if="photoUrl" class="photo__cap">Foto bukti kunjungan · diambil {{ photoTime }} · ketuk untuk ambil ulang</span>
  </button>

  <SectionCard title="Lokasi">
    <template #action><StatusChip :label="locationView.chip" :tone="locationView.tone" /></template>
    <div class="loc" aria-live="polite">
      <div class="loc__tile" :class="failed ? 'loc__tile--error' : 'loc__tile--ok'"><v-icon icon="mdi-crosshairs-gps" size="20" /></div>
      <div class="loc__body">
        <p class="loc__title">{{ locationView.title }}</p>
        <p class="sub">{{ locationView.text }}</p>
      </div>
    </div>
  </SectionCard>

  <div v-if="!failed" class="alert alert--info">
    <v-icon icon="mdi-information-outline" size="20" />
    <p>Jam check-in diambil dari server saat tombol ditekan, bukan dari jam HP.</p>
  </div>
</template>

<style scoped>
.school-card { display: flex; align-items: center; gap: 12px; padding: 16px; }
.school-card__tile { display: flex; align-items: center; justify-content: center; flex: none; width: 40px; height: 40px; border-radius: 8px; background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.school-card__body { flex: 1; min-width: 0; }
.school-card__name { font-size: 14px; line-height: 20px; font-weight: 500; }
.school-card__meta, .sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.school-card__change { min-height: 44px; padding: 0 4px; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-primary)); }
.title { font-size: 16px; line-height: 24px; font-weight: 600; }
.alert { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 8px; font-size: 14px; line-height: 20px; }
.alert--error { background: rgb(var(--v-theme-error-surface)); color: rgb(var(--v-theme-error)); }
.alert--info { background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); }
.alert p { flex: 1; }
.photo { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; position: relative; width: 100%; height: 220px; overflow: hidden; border-radius: 8px; background: rgb(var(--v-theme-canvas-alt)); color: rgb(var(--v-theme-text-secondary)); }
.photo--error { border: 1px dashed rgb(var(--v-theme-error)); background: rgb(var(--v-theme-surface)); color: rgb(var(--v-theme-error)); }
.photo__title { font-size: 13px; line-height: 18px; font-weight: 500; }
.photo--error .sub { color: rgb(var(--v-theme-text-secondary)); }
.photo__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.photo__cap { position: absolute; right: 0; bottom: 0; left: 0; padding: 6px 12px; font-size: 12px; line-height: 16px; background: rgb(var(--v-theme-surface)); border-top: 1px solid rgb(var(--v-theme-border)); color: rgb(var(--v-theme-on-surface)); }
.loc { display: flex; align-items: center; gap: 12px; }
.loc__tile { display: flex; align-items: center; justify-content: center; flex: none; width: 36px; height: 36px; border-radius: 8px; }
.loc__tile--ok { background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.loc__tile--error { background: rgb(var(--v-theme-error-surface)); color: rgb(var(--v-theme-error)); }
.loc__body { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.loc__title { font-size: 14px; line-height: 20px; font-weight: 500; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
