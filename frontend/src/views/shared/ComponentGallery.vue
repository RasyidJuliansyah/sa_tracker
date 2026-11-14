<script setup lang="ts">
import { ref } from 'vue'
import ChangeChip from '@/components/ChangeChip.vue'
import DataTableFooter from '@/components/DataTableFooter.vue'
import EmptyState from '@/components/EmptyState.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatCard from '@/components/StatCard.vue'
import StatusChip, { type ChipTone } from '@/components/StatusChip.vue'

// Galeri komponen bersama untuk pemeriksaan visual. Hanya ada saat dev (route /_komponen).
const tones: { tone: ChipTone; label: string }[] = [
  { tone: 'neutral', label: 'Netral' }, { tone: 'brand', label: 'Brand' }, { tone: 'success', label: 'Sukses' },
  { tone: 'error', label: 'Galat' }, { tone: 'warning', label: 'Peringatan' }, { tone: 'info', label: 'Info' }, { tone: 'accent', label: 'Aksen' },
]
const headers = [
  { title: 'Sekolah', key: 'school' },
  { title: 'Agent', key: 'agent' },
  { title: 'Status', key: 'status' },
]
const items = Array.from({ length: 23 }, (_, i) => ({ school: `SMA Contoh ${i + 1}`, agent: 'Dimas Saputra', status: i % 2 ? 'Selesai' : 'Berlangsung' }))
const page = ref(1)
const perPage = ref(10)
const text = ref('Contoh isi')
</script>

<template>
  <div class="gallery">
    <v-card class="pa-6">
      <h2 class="gallery__h">Tombol</h2>
      <div class="gallery__row">
        <v-btn>Primer</v-btn>
        <v-btn variant="outlined">Sekunder</v-btn>
        <v-btn variant="text">Teks</v-btn>
        <v-btn color="error">Bahaya</v-btn>
        <v-btn prepend-icon="mdi-plus">Dengan ikon</v-btn>
      </div>
      <h2 class="gallery__h">Chip</h2>
      <div class="gallery__row">
        <StatusChip v-for="t in tones" :key="t.tone" :tone="t.tone" :label="t.label" />
        <ChangeChip direction="up" label="+12,5%" />
        <ChangeChip direction="down" label="−4,2%" />
      </div>
      <h2 class="gallery__h">Input</h2>
      <div class="gallery__row gallery__row--fields">
        <LabeledField id="g1" v-model="text" label="Terisi" />
        <LabeledField id="g2" label="Kosong" placeholder="Masukkan nama" />
        <LabeledField id="g3" label="Galat" model-value="x" error-messages="Format tidak valid" />
        <LabeledField id="g4" label="Textarea" multiline placeholder="Tulis laporan" />
      </div>
    </v-card>
    <div class="gallery__stats">
      <StatCard label="Kunjungan selesai" value="128" icon="mdi-map-marker-check-outline" tone="brand" :change="{ direction: 'up', label: '+12,5%' }" comparison="vs minggu lalu" />
      <StatCard label="Retention 2026" value="39,6%" icon="mdi-trending-up" tone="success" />
      <StatCard label="Belum dikunjungi" value="4" icon="mdi-alert-outline" tone="warning" />
      <StatCard label="Sekolah dikunjungi" value="17" icon="mdi-school-outline" tone="info" :change="{ direction: 'down', label: '−2' }" comparison="vs minggu lalu" />
      <StatCard label="Rata-rata durasi" :value="null" icon="mdi-timer-outline" tone="accent" />
    </div>
    <v-card><EmptyState title="Belum ada kunjungan" description="Kunjungan akan muncul di sini setelah agent melakukan check-in." /></v-card>
    <v-card>
      <v-data-table :headers="headers" :items="items" :page="page" :items-per-page="perPage" hide-default-footer>
        <template #bottom>
          <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="items.length" />
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.gallery { display: flex; flex-direction: column; gap: 32px; padding: 32px; background: rgb(var(--v-theme-background)); }
.gallery__h { font-size: 16px; line-height: 24px; font-weight: 600; margin: 16px 0 12px; }
.gallery__row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.gallery__row--fields { align-items: flex-start; }
.gallery__row--fields > * { width: 320px; }
.gallery__stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
</style>
