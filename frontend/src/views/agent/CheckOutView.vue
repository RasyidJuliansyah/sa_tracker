<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@/components/EmptyState.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatusChip from '@/components/StatusChip.vue'
import BottomAction from '@/components/agent/BottomAction.vue'
import { visitMinutes } from '@/components/agent/visit-format'
import { agentService } from '@/services/agent'
import { VisitError, useAgentVisitsStore } from '@/stores/agent-visits'
import { formatDuration } from '@/utils/format'
import { formatClock } from '@/utils/timezone'

const router = useRouter()
const store = useAgentVisitsStore()
const report = ref('')
const error = ref<string | undefined>()
const visit = computed(() => store.ongoing)
const assigned = computed(() => agentService.schools().find((s) => s.id === visit.value?.schoolId)?.assigned ?? false)

function submit() {
  try {
    store.checkOut(report.value)
    router.replace('/agent/check-out/selesai')
  } catch (e) {
    if (!(e instanceof VisitError)) throw e
    error.value = e.message
  }
}
</script>

<template>
  <v-card v-if="!visit">
    <EmptyState icon="mdi-map-marker-check-outline" title="Tidak ada kunjungan berlangsung" description="Check-in di sekolah dulu sebelum membuat laporan check-out.">
      <v-btn color="primary" rounded="pill" height="44" to="/agent/check-in">Ke check-in</v-btn>
    </EmptyState>
  </v-card>
  <div v-else class="checkout">
    <v-card class="card">
      <div class="row">
        <div class="tile tile--school"><v-icon icon="mdi-school-outline" size="22" /></div>
        <div class="grow">
          <p class="name">{{ visit.schoolName }}</p>
          <p class="sub">{{ assigned ? 'Ditugaskan kepada Anda' : 'Sekolah lain' }}</p>
        </div>
        <StatusChip label="Berlangsung" tone="info" />
      </div>
      <div class="facts">
        <div class="fact"><p class="sub">Check-in</p><p class="fact__value">{{ formatClock(visit.checkInAt, visit.timezone) }}</p></div>
        <div class="fact"><p class="sub">Durasi berjalan</p><p class="fact__value">{{ formatDuration(visitMinutes(visit, store.now)) }}</p></div>
      </div>
      <div class="row">
        <div class="tile tile--photo">
          <img v-if="visit.photoUrl" :src="visit.photoUrl" alt="Foto check-in" class="thumb" />
          <v-icon v-else icon="mdi-image-outline" size="24" />
        </div>
        <div class="grow">
          <p class="name">Foto check-in</p>
          <p class="sub">Lokasi tercatat{{ visit.accuracyM ? ` · akurasi ±${visit.accuracyM} m` : '' }}</p>
        </div>
      </div>
    </v-card>

    <LabeledField class="report" id="laporan" v-model="report" label="Laporan kunjungan" multiline no-resize variant="outlined" hint="Wajib diisi. Ceritakan hasil kunjungan dan kondisi sekolah." persistent-hint :error-messages="error" @update:model-value="error = undefined" />

    <div class="alert">
      <v-icon icon="mdi-information-outline" size="20" />
      <p>Jam check-out diambil dari server saat tombol ditekan, bukan dari jam HP.</p>
    </div>
    <BottomAction label="Check-out" icon="mdi-logout" @click="submit" />
  </div>
</template>

<style scoped>
.checkout { display: flex; flex-direction: column; gap: 16px; padding-bottom: 72px; }
.card { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.row { display: flex; align-items: center; gap: 12px; }
.grow { flex: 1; min-width: 0; }
.name { font-size: 14px; line-height: 20px; font-weight: 500; }
.sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.tile { display: flex; align-items: center; justify-content: center; flex: none; overflow: hidden; border-radius: 8px; }
.tile--school { width: 40px; height: 40px; background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); }
.tile--photo { width: 56px; height: 56px; background: rgb(var(--v-theme-canvas-alt)); color: rgb(var(--v-theme-text-secondary)); }
.thumb { width: 100%; height: 100%; object-fit: cover; }
.facts { display: flex; gap: 12px; }
.fact { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; padding: 12px; border-radius: 8px; background: rgb(var(--v-theme-background)); }
.fact__value { font-size: 16px; line-height: 24px; font-weight: 600; white-space: nowrap; }
.alert { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; border-radius: 8px; font-size: 14px; line-height: 20px; background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); }
.alert p { flex: 1; }
.report :deep(.v-field) { height: auto; background: rgb(var(--v-theme-surface)); }
.report :deep(.v-field__input) { mask-image: none; align-items: flex-start; padding: 10px 12px; color: rgb(var(--v-theme-on-surface)); opacity: 1; }
.report :deep(textarea) { padding: 0; margin: 0; line-height: 20px; }
.report :deep(.v-input__details) { padding: 0; margin-top: 6px; min-height: 16px; }
.report :deep(.v-messages) { padding: 0; opacity: 1; color: rgb(var(--v-theme-text-secondary)); }
.report :deep(.v-messages__message) { color: inherit; }
.report :deep(.v-input--error .v-messages) { color: rgb(var(--v-theme-error)); }
</style>
