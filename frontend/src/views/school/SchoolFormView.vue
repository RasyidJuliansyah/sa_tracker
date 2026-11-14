<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import LabeledField from '@/components/LabeledField.vue'
import DateField from '@/components/school/DateField.vue'
import SchoolCard from '@/components/school/SchoolCard.vue'
import { formatDigits, parseDigits } from '@/components/school/school-format'
import { validateSchoolForm } from '@/components/school/school-form-rules'
import type { Level, Pkg } from '@/mocks/school'
import { useReferenceStore } from '@/stores/reference'
import { createSchool, listAgents, npsnOwner } from '@/services/school'
import type { IndoTimezone } from '@/utils/timezone'

// Tambah sekolah (Figma 22:1164). Sekolah baru wajib diisi kontrak pertamanya.
const router = useRouter()
const name = ref('')
const npsn = ref('')
const lmsId = ref('')
const city = ref('')
const level = ref<string | null>(null)
const pkg = ref<string | null>(null)
const timezone = ref<string | null>('WIB')
const pic = ref('')
const address = ref('')
const picContact = ref('')
const coopStart = ref('')
const onboarding = ref('')
const activeUse = ref('')
const coopEnd = ref('')
const signedDate = ref('')
const start = ref('')
const end = ref('')
const valueText = ref('')
const note = ref('')
const agentId = ref<string | null>(null)
const submitted = ref(false)
const saving = ref(false)

const reference = useReferenceStore()
const levelItems = computed(() => reference.levels.map((v) => ({ title: v.name, value: v.name })))
const pkgItems = computed(() => reference.packages.map((v) => ({ title: v.name, value: v.name })))
const zoneItems = ['WIB', 'WITA', 'WIT'].map((z) => ({ title: z, value: z }))
const agentItems = [{ title: 'Belum ditugaskan', value: null }, ...listAgents().map((a) => ({ title: `${a.name} (${a.timezone})`, value: String(a.id) }))]

const errors = computed(() =>
  validateSchoolForm(
    { name: name.value, npsn: npsn.value, lmsId: lmsId.value, city: city.value, level: level.value, pkg: pkg.value, timezone: timezone.value,
      coopStart: coopStart.value, coopEnd: coopEnd.value, signedDate: signedDate.value, start: start.value, end: end.value, value: parseDigits(valueText.value) },
    npsn.value.trim() ? npsnOwner(npsn.value)?.name : undefined,
  ),
)
const shown = (k: keyof typeof errors.value) => (submitted.value ? errors.value[k] : '')
const npsnError = computed(() => (submitted.value || npsnOwner(npsn.value)) && npsn.value.trim() ? errors.value.npsn : shown('npsn'))

async function save() {
  submitted.value = true
  if (Object.values(errors.value).some(Boolean)) {
    document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ block: 'center' })
    return
  }
  saving.value = true
  try {
  const created = await createSchool({
    name: name.value, npsn: npsn.value, lmsSchoolId: lmsId.value.trim() ? Number(lmsId.value) : null, city: city.value,
    level: level.value as Level, pkg: pkg.value as Pkg, timezone: timezone.value as IndoTimezone, pic: pic.value, picContact: picContact.value,
    address: address.value, coopStart: coopStart.value, onboarding: onboarding.value || null, activeUse: activeUse.value || null, coopEnd: coopEnd.value,
    contract: { signedDate: signedDate.value, start: start.value, end: end.value, value: parseDigits(valueText.value), note: note.value },
    agentId: agentId.value ? Number(agentId.value) : null,
  })
  router.push(`/sekolah/${created.id}`)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="tambah" novalidate @submit.prevent="save">
    <nav class="tambah__crumb" aria-label="Jejak halaman">
      <router-link to="/sekolah">Sekolah</router-link>
      <v-icon icon="mdi-chevron-right" size="16" />
      <span>Tambah sekolah</span>
    </nav>

    <SchoolCard title="Data sekolah" subtitle="NPSN tidak boleh ganda. Kolom bertanda * wajib diisi.">
      <div class="tambah__grid">
        <LabeledField id="sk-name" v-model="name" label="Nama sekolah *" :error-messages="shown('name')" />
        <LabeledField id="sk-npsn" v-model="npsn" label="NPSN *" inputmode="numeric" :error-messages="npsnError" />
        <LabeledField id="sk-lms" v-model="lmsId" label="ID LMS Skolla" placeholder="Opsional, angka" inputmode="numeric" :error-messages="shown('lmsId')" />
        <LabeledField id="sk-city" v-model="city" label="Kota *" :error-messages="shown('city')" />
        <LabeledSelect id="sk-level" v-model="level" label="Jenjang *" :items="levelItems" :error-messages="shown('level')" />
        <LabeledSelect id="sk-pkg" v-model="pkg" label="Paket *" :items="pkgItems" :error-messages="shown('pkg')" />
        <LabeledSelect id="sk-tz" v-model="timezone" label="Zona waktu *" :items="zoneItems" :error-messages="shown('timezone')" />
        <LabeledField id="sk-pic" v-model="pic" label="PIC" />
        <div class="tambah__full"><LabeledField id="sk-address" v-model="address" label="Alamat" /></div>
        <LabeledField id="sk-contact" v-model="picContact" label="Kontak PIC" />
      </div>
    </SchoolCard>

    <SchoolCard title="Tanggal kerja sama">
      <div class="tambah__grid tambah__grid--4">
        <DateField id="sk-coop-start" v-model="coopStart" label="Mulai kerja sama *" :error-messages="shown('coopStart')" />
        <DateField id="sk-onboarding" v-model="onboarding" label="Onboarding" />
        <DateField id="sk-active" v-model="activeUse" label="Aktif menggunakan" />
        <DateField id="sk-coop-end" v-model="coopEnd" label="Berakhir *" :error-messages="shown('coopEnd')" />
      </div>
    </SchoolCard>

    <SchoolCard title="Kontrak pertama" subtitle="Wajib untuk sekolah baru. Tanggal diisi sesuai dokumen kontrak; durasi boleh berbeda.">
      <div class="tambah__grid tambah__grid--4">
        <DateField id="sk-signed" v-model="signedDate" label="Tanggal tanda tangan klien *" :error-messages="shown('signedDate')" />
        <DateField id="sk-start" v-model="start" label="Tanggal mulai *" :error-messages="shown('start')" />
        <DateField id="sk-end" v-model="end" label="Tanggal berakhir *" :error-messages="shown('end')" />
        <LabeledField
          id="sk-value" :model-value="valueText" label="Nilai kontrak (Rp) *" inputmode="numeric" :error-messages="shown('value')"
          @update:model-value="valueText = formatDigits(parseDigits($event))"
        />
        <div class="tambah__full"><LabeledField id="sk-note" v-model="note" label="Catatan" placeholder="Opsional" multiline hint="Misalnya nomor dokumen kontrak" persistent-hint /></div>
      </div>
    </SchoolCard>

    <SchoolCard title="Penugasan" subtitle="Opsional. Sekolah boleh tanpa agent.">
      <div class="tambah__grid">
        <LabeledSelect id="sk-agent" v-model="agentId" label="Agent" :items="agentItems" />
      </div>
    </SchoolCard>

    <div class="tambah__actions">
      <v-btn variant="outlined" to="/sekolah">Batal</v-btn>
      <v-btn type="submit" prepend-icon="mdi-check" :loading="saving">Simpan sekolah</v-btn>
    </div>
  </form>
</template>

<style scoped>
.tambah { display: flex; flex-direction: column; gap: 24px; }
.tambah__crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 18px; color: rgb(var(--v-theme-text-secondary)); }
.tambah__crumb a { color: rgb(var(--v-theme-primary)); font-weight: 500; text-decoration: none; }
.tambah__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
.tambah__grid--4 { grid-template-columns: repeat(4, 1fr); gap: 24px 24px; }
.tambah__full { grid-column: 1 / -1; }
.tambah__actions { display: flex; justify-content: flex-end; gap: 12px; }
.tambah :deep(input::placeholder), .tambah :deep(textarea::placeholder) { color: rgb(var(--v-theme-text-secondary)); opacity: 1; }
.tambah :deep(.v-messages) { opacity: 1; }
.tambah :deep(.v-input__details) { padding-inline: 0; }
.tambah :deep(.v-field__input) { opacity: 1; }
.tambah :deep(.v-textarea textarea) { resize: none; }
.tambah :deep(.v-textarea .v-field__input) { padding: 10px 12px; min-height: 132px; }
</style>
