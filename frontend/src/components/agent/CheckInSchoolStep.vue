<script setup lang="ts">
import { computed, ref } from 'vue'
import LabeledField from '@/components/LabeledField.vue'
import SchoolOption from './SchoolOption.vue'
import { filterSchools, groupSchoolsForCheckIn } from './visit-rules'
import type { SchoolLite } from './visit-rules'

// Langkah 1: pilih sekolah. Sekolah yang ditugaskan tampil paling atas.
const props = defineProps<{ schools: SchoolLite[] }>()
const selectedId = defineModel<number | null>({ required: true })
const query = ref('')
const groups = computed(() => groupSchoolsForCheckIn(filterSchools(props.schools, query.value)))
</script>

<template>
  <LabeledField class="search" id="cari-sekolah" v-model="query" label="Cari sekolah" placeholder="Cari nama sekolah atau NPSN" append-inner-icon="mdi-magnify" density="compact" variant="outlined" />
  <div role="radiogroup" aria-label="Pilih sekolah" class="step">
    <template v-if="groups.planToday.length">
      <div>
        <h2 class="step__title">Rencana hari ini</h2>
        <p class="step__sub">Sekolah di luar tugas yang sudah disetujui manager</p>
      </div>
      <SchoolOption v-for="s in groups.planToday" :key="s.id" :school="s" :selected="selectedId === s.id" @select="selectedId = s.id" />
    </template>
    <template v-if="groups.assigned.length">
      <div>
        <h2 class="step__title">Ditugaskan kepada Anda</h2>
        <p class="step__sub">Tampil paling atas</p>
      </div>
      <SchoolOption v-for="s in groups.assigned" :key="s.id" :school="s" :selected="selectedId === s.id" @select="selectedId = s.id" />
    </template>
    <p v-if="!groups.planToday.length && !groups.assigned.length" class="step__sub">Tidak ada sekolah yang bisa dikunjungi hari ini.</p>

    <div class="step__ask">
      <h2 class="step__title">Tidak menemukan sekolah yang dituju?</h2>
      <p class="step__sub">Sekolah di luar tugas Anda tidak bisa di-check-in langsung. Ajukan rencana kunjungan agar disetujui manager.</p>
      <v-btn variant="outlined" rounded="pill" height="44" prepend-icon="mdi-plus" block to="/agent/rencana/buat">Ajukan kunjungan ke sekolah lain</v-btn>
    </div>
  </div>
</template>

<style scoped>
.search :deep(.v-field) { background: rgb(var(--v-theme-surface)); }
.search :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
.step { display: flex; flex-direction: column; gap: 16px; }
.step__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.step__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.step__ask { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
</style>
