<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import LabeledField from '@/components/LabeledField.vue'
import SchoolOption from '@/components/agent/SchoolOption.vue'
import { filterSchools } from '@/components/agent/visit-rules'
import { agentService } from '@/services/agent'
import { agentPlans } from '@/services/agent-plans'
import { wibDateKey } from '@/utils/timezone'

const router = useRouter()
const allSchools = agentService.schools()

const query = ref('')
const schoolId = ref<number | null>(null)
const planDate = ref('')
const purpose = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

const today = wibDateKey(new Date())
const maxDate = (() => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 90); return d.toISOString().slice(0, 10) })()

const filtered = computed(() => filterSchools(allSchools, query.value))
const assigned = computed(() => filtered.value.filter((s) => s.assigned))
const others = computed(() => filtered.value.filter((s) => !s.assigned))
const selected = computed(() => allSchools.find((s) => s.id === schoolId.value) ?? null)
const needsApproval = computed(() => selected.value !== null && !selected.value.assigned)
const purposeLen = computed(() => purpose.value.trim().length)
const valid = computed(() => schoolId.value !== null && planDate.value !== '' && purposeLen.value >= 5 && purposeLen.value <= 255)

async function submit() {
  if (!valid.value || schoolId.value === null) return
  submitting.value = true
  error.value = null
  try {
    await agentPlans.create({ schoolId: schoolId.value, planDate: planDate.value, purpose: purpose.value.trim() })
    router.push('/agent/rencana')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan rencana.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="buat">
    <LabeledField id="cari-sekolah" v-model="query" label="Cari sekolah" placeholder="Cari nama sekolah atau NPSN" append-inner-icon="mdi-magnify" density="compact" variant="outlined" />

    <div role="radiogroup" aria-label="Pilih sekolah" class="group">
      <template v-if="assigned.length">
        <div>
          <h2 class="group__title">Sekolah saya</h2>
          <p class="group__sub">Langsung terjadwal, tanpa persetujuan</p>
        </div>
        <SchoolOption v-for="s in assigned" :key="s.id" :school="s" :selected="schoolId === s.id" @select="schoolId = s.id" />
      </template>
      <template v-if="others.length">
        <div>
          <h2 class="group__title">Sekolah lain</h2>
          <p class="group__sub">Perlu persetujuan manager sebelum Anda bisa check-in</p>
        </div>
        <SchoolOption v-for="s in others" :key="s.id" :school="s" :selected="schoolId === s.id" show-pending @select="schoolId = s.id" />
      </template>
      <p v-if="!filtered.length" class="group__sub">Tidak ada sekolah yang cocok dengan pencarian.</p>
    </div>

    <LabeledField id="tanggal" v-model="planDate" label="Tanggal kunjungan" type="date" :min="today" :max="maxDate" density="compact" variant="outlined" hint="Paling cepat hari ini, paling jauh 90 hari ke depan (WIB)" persistent-hint />

    <v-textarea v-model="purpose" label="Tujuan kunjungan" variant="outlined" rows="4" counter="255" :maxlength="255" auto-grow hint="Minimal 5 karakter" persistent-hint />

    <div v-if="needsApproval" class="note">
      <v-icon icon="mdi-alert-circle-outline" size="18" />
      <span>Sekolah ini bukan tugas Anda, jadi rencana ini menjadi pengajuan. Anda baru bisa check-in setelah manager menyetujui, pada tanggal kunjungan.</span>
    </div>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <v-btn color="primary" rounded="pill" height="44" block :disabled="!valid" :loading="submitting" @click="submit">
      {{ needsApproval ? 'Kirim pengajuan' : 'Simpan rencana' }}
    </v-btn>
  </div>
</template>

<style scoped>
.buat { display: flex; flex-direction: column; gap: 16px; padding-bottom: 24px; }
.group { display: flex; flex-direction: column; gap: 16px; }
.group__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.group__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.note { display: flex; gap: 8px; padding: 12px; border-radius: 8px; font-size: 12px; line-height: 16px; background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); }
.note .v-icon { flex: none; margin-top: 1px; }
.error { font-size: 13px; color: rgb(var(--v-theme-error)); }
</style>
