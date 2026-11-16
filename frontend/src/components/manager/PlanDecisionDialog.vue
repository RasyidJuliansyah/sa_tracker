<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DialogShell from '@/components/admin/DialogShell.vue'
import LabeledField from '@/components/LabeledField.vue'
import StatusChip from '@/components/StatusChip.vue'
import { managerPlans, planStatusChip, type PlanDecisionDetail } from '@/services/manager-plans'
import { formatDateLong, formatRupiah } from '@/utils/format'
import { formatClock, wibDateKey } from '@/utils/timezone'

// Detail pengajuan (FR-9) + Setujui/Tolak (FR-10). Hanya tampil untuk rencana PENDING, tanggal hari ini atau setelahnya.
const props = defineProps<{ planId: number | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ decided: [] }>()

const detail = ref<PlanDecisionDetail | null>(null)
const loading = ref(false)
const note = ref('')
const submitted = ref(false)
const deciding = ref<'APPROVE' | 'REJECT' | null>(null)
const error = ref('')

const today = wibDateKey(new Date())
const canDecide = computed(() => detail.value?.plan.status === 'PENDING' && (detail.value?.plan.planDate ?? '') >= today)
const rejectError = computed(() => (submitted.value && !note.value.trim() ? 'Alasan penolakan wajib diisi' : ''))

watch([open, () => props.planId], async ([isOpen, id]) => {
  if (!isOpen || !id) return
  detail.value = null
  note.value = ''
  submitted.value = false
  error.value = ''
  loading.value = true
  try { detail.value = await managerPlans.decision(id) } finally { loading.value = false }
}, { immediate: true })

async function decide(action: 'APPROVE' | 'REJECT') {
  if (!props.planId) return
  if (action === 'REJECT') {
    submitted.value = true
    if (!note.value.trim()) return
  }
  deciding.value = action
  error.value = ''
  try {
    await (action === 'APPROVE' ? managerPlans.approve(props.planId, note.value) : managerPlans.reject(props.planId, note.value))
    open.value = false
    emit('decided')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Gagal menyimpan keputusan.'
  } finally {
    deciding.value = null
  }
}
</script>

<template>
  <DialogShell v-model="open" title="Detail pengajuan" :subtitle="detail?.school?.name ?? ''" :width="620" :top="80">
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <div v-else-if="detail" class="plan-detail">
      <div class="plan-detail__head">
        <StatusChip :label="planStatusChip(detail.plan.status).label" :tone="planStatusChip(detail.plan.status).tone" />
        <span class="plan-detail__meta">Diajukan {{ detail.plan.agentName }} · {{ formatDateLong(detail.plan.createdAt) }}</span>
      </div>

      <section class="plan-detail__section">
        <h3 class="plan-detail__h">Rencana kunjungan</h3>
        <dl class="plan-detail__grid">
          <div><dt>Tanggal</dt><dd>{{ formatDateLong(`${detail.plan.planDate}T12:00:00+07:00`) }}</dd></div>
          <div><dt>Tujuan</dt><dd>{{ detail.plan.purpose }}</dd></div>
        </dl>
      </section>

      <section v-if="detail.school" class="plan-detail__section">
        <h3 class="plan-detail__h">Profil sekolah</h3>
        <dl class="plan-detail__grid">
          <div><dt>Sekolah</dt><dd>{{ detail.school.name }}</dd></div>
          <div><dt>NPSN</dt><dd>{{ detail.school.npsn }}</dd></div>
          <div><dt>Jenjang / Paket</dt><dd>{{ detail.school.jenjang }} · {{ detail.school.package }}</dd></div>
          <div><dt>Kota</dt><dd>{{ detail.school.city ?? '–' }}</dd></div>
          <div><dt>Alamat</dt><dd>{{ detail.school.address ?? '–' }}</dd></div>
          <div><dt>PIC</dt><dd>{{ detail.school.picName ? `${detail.school.picName} (${detail.school.picContact ?? '–'})` : '–' }}</dd></div>
          <div><dt>Agent pemegang</dt><dd>{{ detail.holder?.name ?? 'Tanpa agent' }}</dd></div>
          <div><dt>Kontrak berjalan</dt><dd>{{ detail.currentContract ? formatRupiah(detail.currentContract.value) : 'Tidak ada kontrak berjalan' }}</dd></div>
        </dl>
      </section>

      <section class="plan-detail__section">
        <h3 class="plan-detail__h">5 kunjungan terakhir ke sekolah ini</h3>
        <p v-if="!detail.recentVisits.length" class="plan-detail__empty">Belum ada kunjungan ke sekolah ini.</p>
        <ul v-else class="plan-detail__visits">
          <li v-for="v in detail.recentVisits" :key="v.id">{{ v.agentName }} · {{ formatClock(v.checkInAt, 'WIB') }} · {{ v.status === 'DONE' ? 'Selesai' : 'Berlangsung' }}</li>
        </ul>
      </section>

      <section v-if="detail.plan.decisionNote" class="plan-detail__section">
        <h3 class="plan-detail__h">Catatan keputusan</h3>
        <p>{{ detail.plan.decisionNote }}</p>
      </section>

      <template v-if="canDecide">
        <LabeledField id="pd-note" v-model="note" label="Catatan (opsional untuk setuju, wajib untuk tolak)" multiline :error-messages="rejectError" />
        <p v-if="error" class="plan-detail__error" role="alert">{{ error }}</p>
        <div class="plan-detail__actions">
          <v-btn variant="outlined" color="error" :loading="deciding === 'REJECT'" @click="decide('REJECT')">Tolak</v-btn>
          <v-btn color="primary" :loading="deciding === 'APPROVE'" @click="decide('APPROVE')">Setujui</v-btn>
        </div>
      </template>
      <p v-else-if="detail.plan.status === 'PENDING'" class="plan-detail__empty">Tanggal rencana ini sudah lewat, tidak bisa diputuskan lagi.</p>
    </div>
  </DialogShell>
</template>

<style scoped>
.plan-detail { display: flex; flex-direction: column; gap: 20px; }
.plan-detail__head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.plan-detail__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.plan-detail__section { display: flex; flex-direction: column; gap: 8px; }
.plan-detail__h { font-size: 13px; line-height: 18px; font-weight: 600; color: rgb(var(--v-theme-text-secondary)); }
.plan-detail__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; font-size: 14px; line-height: 20px; }
.plan-detail__grid dt { font-size: 12px; color: rgb(var(--v-theme-text-secondary)); }
.plan-detail__grid dd { margin: 0; }
.plan-detail__visits { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; list-style: none; font-size: 14px; }
.plan-detail__empty { font-size: 13px; color: rgb(var(--v-theme-text-secondary)); }
.plan-detail__error { font-size: 13px; color: rgb(var(--v-theme-error)); }
.plan-detail__actions { display: flex; justify-content: flex-end; gap: 12px; }
</style>
