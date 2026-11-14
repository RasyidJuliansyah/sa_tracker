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
    <template v-if="groups.assigned.length">
      <div>
        <h2 class="step__title">Ditugaskan kepada Anda</h2>
        <p class="step__sub">Tampil paling atas</p>
      </div>
      <SchoolOption v-for="s in groups.assigned" :key="s.id" :school="s" :selected="selectedId === s.id" @select="selectedId = s.id" />
    </template>
    <template v-if="groups.others.length">
      <div>
        <h2 class="step__title">Sekolah lain</h2>
        <p class="step__sub">Tetap boleh check-in di sekolah yang tidak ditugaskan</p>
      </div>
      <SchoolOption v-for="s in groups.others" :key="s.id" :school="s" :selected="selectedId === s.id" @select="selectedId = s.id" />
    </template>
    <p v-if="!groups.assigned.length && !groups.others.length" class="step__sub">Tidak ada sekolah yang cocok dengan pencarian.</p>
  </div>
</template>

<style scoped>
.search :deep(.v-field) { background: rgb(var(--v-theme-surface)); }
.search :deep(input::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
.step { display: flex; flex-direction: column; gap: 16px; }
.step__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.step__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
</style>
