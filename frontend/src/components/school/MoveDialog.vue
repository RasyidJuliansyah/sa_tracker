<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LabeledField from '@/components/LabeledField.vue'
import DialogShell from '@/components/admin/DialogShell.vue'
import LabeledSelect from '@/components/admin/LabeledSelect.vue'
import type { MockAgent } from '@/mocks/school'
import { formatDay, initials } from './school-format'

// Pindahkan sekolah (Figma 23:1357) dan Tugaskan (sekolah tanpa agent). Satu agent aktif per sekolah untuk MVP.
export interface MoveTarget { schoolId: number; name: string; npsn: string }
const props = defineProps<{
  target: MoveTarget | null
  current: { agentId: number; name: string; since: string } | null
  agents: MockAgent[]
  /** Bila `target` kosong, pilih sekolah dari sini (tombol Tugaskan sekolah). */
  choices?: MoveTarget[]
  defaultAgentId?: number | null
}>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ submit: [{ schoolId: number; agentId: number }] }>()

const schoolId = ref<string | null>(null)
const agentId = ref<string | null>(null)
const submitted = ref(false)
const isMove = computed(() => !!props.current)
const chosen = computed(() => props.target ?? props.choices?.find((c) => String(c.schoolId) === schoolId.value) ?? null)
const agentItems = computed(() => props.agents.filter((a) => a.id !== props.current?.agentId).map((a) => ({ title: `${a.name} (${a.timezone})`, value: String(a.id) })))
const agentName = computed(() => props.agents.find((a) => String(a.id) === agentId.value)?.name ?? 'agent baru')

watch(open, (isOpen) => {
  if (!isOpen) return
  submitted.value = false
  schoolId.value = null
  agentId.value = props.defaultAgentId && !(props.current?.agentId === props.defaultAgentId) ? String(props.defaultAgentId) : (agentItems.value[0]?.value ?? null)
})

function submit() {
  submitted.value = true
  if (!chosen.value || !agentId.value) return
  emit('submit', { schoolId: chosen.value.schoolId, agentId: Number(agentId.value) })
  open.value = false
}
</script>

<template>
  <DialogShell
    v-model="open" :title="isMove ? 'Pindahkan sekolah' : 'Tugaskan sekolah'"
    :subtitle="chosen ? `${chosen.name} • NPSN ${chosen.npsn}` : 'Pilih sekolah yang belum punya agent'" :width="540" :top="120"
  >
    <form class="move" novalidate @submit.prevent="submit">
      <LabeledSelect
        v-if="!target" id="mv-school" v-model="schoolId" label="Sekolah *" placeholder="Pilih sekolah"
        :items="(choices ?? []).map((c) => ({ title: c.name, value: String(c.schoolId) }))" :error-messages="submitted && !chosen ? 'Sekolah wajib dipilih' : ''"
      />
      <div class="move__from">
        <span class="move__avatar">{{ current ? initials(current.name) : '–' }}</span>
        <div>
          <p class="move__from-title">{{ current ? `Dari: ${current.name}` : 'Belum ada agent' }}</p>
          <p class="move__from-sub">{{ current ? `Ditugaskan sejak ${formatDay(current.since)}` : 'Sekolah ini belum punya penanggung jawab' }}</p>
        </div>
      </div>
      <LabeledSelect id="mv-agent" v-model="agentId" label="Ke agent *" :items="agentItems" :error-messages="submitted && !agentId ? 'Agent wajib dipilih' : ''" />
      <div>
        <LabeledField id="mv-share" model-value="100%" label="Porsi penugasan" readonly append-inner-icon="mdi-lock-outline" />
        <p class="move__hint">Pengaturan porsi untuk lebih dari satu agent tersedia di Fase 2</p>
      </div>
      <div class="move__warn" role="note">
        <v-icon icon="mdi-alert-outline" size="22" />
        <p v-if="isMove">Retention sekolah ini, termasuk perpanjangan yang sudah ditandatangani, ikut pindah ke {{ agentName }}. Penugasan lama ditutup dan tetap tersimpan.</p>
        <p v-else>Sekolah ini ditugaskan ke {{ agentName }} dengan porsi 100%. Retention sekolah akan dihitung ke agent ini.</p>
      </div>
      <div class="move__actions">
        <v-btn variant="outlined" @click="open = false">Batal</v-btn>
        <v-btn type="submit" :prepend-icon="isMove ? 'mdi-swap-horizontal' : 'mdi-check'">{{ isMove ? 'Pindahkan' : 'Tugaskan' }}</v-btn>
      </div>
    </form>
  </DialogShell>
</template>

<style scoped>
.move { display: flex; flex-direction: column; gap: 20px; }
.move__from { display: flex; align-items: center; gap: 12px; padding: 16px; border-radius: 8px; background: rgb(var(--v-theme-background)); }
.move__avatar {
  display: inline-flex; align-items: center; justify-content: center; flex: none; width: 32px; height: 32px; border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft)); color: rgb(var(--v-theme-secondary)); font-size: 12px; font-weight: 600;
}
.move__from-title { font-size: 14px; line-height: 20px; font-weight: 600; }
.move__from-sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.move__hint { margin-top: 6px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.move__warn { display: flex; gap: 12px; padding: 14px 16px; border-radius: 8px; background: color-mix(in srgb, rgb(var(--v-theme-warning-solid)) 15%, white); color: rgb(var(--v-theme-warning)); font-size: 14px; line-height: 20px; }
.move__actions { display: flex; justify-content: flex-end; gap: 12px; }
.move :deep(.v-field--disabled), .move :deep(input[readonly]) { color: rgb(var(--v-theme-text-secondary)); }
</style>
