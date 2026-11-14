<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BottomAction from '@/components/agent/BottomAction.vue'
import CheckInCaptureStep from '@/components/agent/CheckInCaptureStep.vue'
import CheckInSchoolStep from '@/components/agent/CheckInSchoolStep.vue'
import { compressImage } from '@/components/agent/compress-image'
import { getLocation } from '@/components/agent/geolocation'
import type { LocationFailure, LocationFix } from '@/components/agent/geolocation'
import { checkInRejection } from '@/components/agent/visit-rules'
import type { LocationState } from '@/components/agent/visit-rules'
import { agentService } from '@/services/agent'
import { MOCK_AUTH } from '@/stores/session'
import { VisitError, useAgentVisitsStore } from '@/stores/agent-visits'
import { formatClock } from '@/utils/timezone'

const router = useRouter()
const store = useAgentVisitsStore()
const schools = agentService.schools()

const step = ref<1 | 2>(1)
const schoolId = ref<number | null>(schools.find((s) => s.assigned)?.id ?? null)
const school = computed(() => schools.find((s) => s.id === schoolId.value) ?? null)
const photoUrl = ref<string | null>(null)
const photoFile = ref<File | null>(null)
const photoTime = ref<string | null>(null)
const location = ref<LocationFix | null>(null)
const locationState = ref<LocationState>('idle')
let saved = false
const attempted = ref(false)
const submitError = ref<string | null>(null)

const locationFailed = computed(() => ['denied', 'unavailable', 'timeout'].includes(locationState.value))
// Alasan penolakan ditampilkan setelah aksi ditekan, atau segera saat lokasi gagal.
const error = computed(() => {
  if (submitError.value) return submitError.value
  if (!attempted.value && !locationFailed.value) return null
  return checkInRejection({ schoolId: schoolId.value, hasPhoto: Boolean(photoUrl.value), location: locationState.value })
})

async function requestLocation() {
  locationState.value = 'loading'
  location.value = null
  try {
    location.value = await getLocation()
    locationState.value = 'ok'
  } catch (reason) {
    locationState.value = reason as LocationFailure
  }
}

function toCapture() {
  step.value = 2
  if (locationState.value !== 'ok') void requestLocation()
}
function onPhoto(file: File) {
  photoFile.value = file
  if (!MOCK_AUTH) void compressImage(file).then((c) => { if (photoFile.value === file) photoFile.value = c })
  if (photoUrl.value) URL.revokeObjectURL(photoUrl.value)
  photoUrl.value = URL.createObjectURL(file)
  photoTime.value = formatClock(store.now, store.timezone).replace(` ${store.timezone}`, '')
  submitError.value = null
}
async function submit() {
  attempted.value = true
  if (locationFailed.value) return void requestLocation()
  try {
    if (!MOCK_AUTH) {
      await store.checkInApi({ schoolId: schoolId.value, file: photoFile.value, location: location.value })
      saved = true
      router.push('/agent')
      return
    }
    store.checkIn({ schoolId: schoolId.value, hasPhoto: Boolean(photoUrl.value), location: location.value, photoUrl: photoUrl.value })
    saved = true
    router.push('/agent')
  } catch (e) {
    if (!(e instanceof VisitError)) throw e
    submitError.value = e.message
  }
}
watch(schoolId, () => (submitError.value = null))
// Foto yang sudah dipakai kunjungan tetap hidup selama sesi (untuk miniatur di Check-out).
onBeforeUnmount(() => photoUrl.value && !saved && URL.revokeObjectURL(photoUrl.value))
onMounted(() => window.scrollTo(0, 0))
</script>

<template>
  <div class="checkin">
    <div v-if="store.ongoing" class="blocked" role="alert">
      <v-icon icon="mdi-information-outline" size="20" />
      <div>
        <p>Anda masih punya kunjungan yang berlangsung di {{ store.ongoing.schoolName }}. Satu agent hanya boleh punya satu kunjungan berlangsung.</p>
        <v-btn class="mt-3" color="primary" rounded="pill" height="44" to="/agent/check-out">Ke check-out</v-btn>
      </div>
    </div>
    <template v-else>
      <ol v-if="step === 1" class="steps" aria-label="Langkah check-in">
        <li class="steps__item steps__item--on" aria-current="step"><span class="steps__dot">1</span>Pilih sekolah</li>
        <li class="steps__line" aria-hidden="true" />
        <li class="steps__item"><span class="steps__dot">2</span>Foto &amp; lokasi</li>
      </ol>
      <CheckInSchoolStep v-if="step === 1" v-model="schoolId" :schools="schools" />
      <CheckInCaptureStep v-else-if="school" :school="school" :location="location" :location-state="locationState" :photo-url="photoUrl" :photo-time="photoTime" :error="error" @change="step = 1" @photo="onPhoto" />

      <BottomAction v-if="step === 1" label="Lanjut ke foto" icon="mdi-camera-outline" :disabled="schoolId === null" @click="toCapture" />
      <BottomAction v-else-if="locationFailed" label="Coba lagi" icon="mdi-refresh" @click="submit" />
      <BottomAction v-else label="Check-in sekarang" icon="mdi-map-marker-check-outline" :loading="locationState === 'loading'" @click="submit" />
    </template>
  </div>
</template>

<style scoped>
.checkin { display: flex; flex-direction: column; gap: 16px; padding-bottom: 72px; }
.steps { display: flex; align-items: center; gap: 8px; list-style: none; }
.steps__item { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.steps__item--on { color: rgb(var(--v-theme-secondary)); }
.steps__dot { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 999px; background: rgb(var(--v-theme-canvas-alt)); }
.steps__item--on .steps__dot { background: rgb(var(--v-theme-primary)); color: rgb(var(--v-theme-on-primary)); }
.steps__line { width: 32px; height: 1px; background: rgb(var(--v-theme-border)); }
.blocked { display: flex; gap: 10px; padding: 12px 16px; border-radius: 8px; font-size: 14px; line-height: 20px; background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); }
</style>
