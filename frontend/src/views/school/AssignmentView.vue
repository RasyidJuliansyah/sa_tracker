<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '@/components/EmptyState.vue'
import MoveDialog, { type MoveTarget } from '@/components/school/MoveDialog.vue'
import { formatDay, formatPeriod, initials } from '@/components/school/school-format'
import { assignSchool, listAgents, listAssignmentsByAgent, type AgentSummary, type SchoolRow } from '@/services/school'
import { formatPercent } from '@/utils/format'

// Penugasan – Per agent (Figma 23:1126) dan Pindahkan sekolah (23:1357). MVP: satu agent aktif per sekolah.
const perAgent = ref<AgentSummary[]>([])
const unassigned = ref<SchoolRow[]>([])
const selectedId = ref(1)
const moveOpen = ref(false)
const moveTarget = ref<MoveTarget | null>(null)
const moveCurrent = ref<{ agentId: number; name: string; since: string } | null>(null)
const moveChoices = ref<MoveTarget[]>([])
const snack = ref({ show: false, text: '' })
const unassignedSection = ref<HTMLElement | null>(null)

async function load() {
  const data = await listAssignmentsByAgent()
  perAgent.value = data.perAgent
  unassigned.value = data.unassigned
}
onMounted(load)

const selected = computed(() => perAgent.value.find((a) => a.agent.id === selectedId.value))
const toTarget = (r: SchoolRow): MoveTarget => ({ schoolId: r.school.id, name: r.school.name, npsn: r.school.npsn })

function openMove(entry: AgentSummary['rows'][number]) {
  moveTarget.value = toTarget(entry.row)
  moveCurrent.value = { agentId: entry.assignment.agentId, name: selected.value?.agent.name ?? '', since: entry.assignment.assignedAt }
  moveChoices.value = []
  moveOpen.value = true
}
function openAssign(row: SchoolRow | null) {
  moveTarget.value = row ? toTarget(row) : null
  moveCurrent.value = null
  moveChoices.value = unassigned.value.map(toTarget)
  moveOpen.value = true
}
async function onSubmit(input: { schoolId: number; agentId: number }) {
  await assignSchool(input.schoolId, input.agentId)
  await load()
  const name = listAgents().find((a) => a.id === input.agentId)?.name
  snack.value = { show: true, text: `Penugasan diperbarui: ${name}` }
}
</script>

<template>
  <div class="tugas">
    <div class="tugas__info" role="note">
      <v-icon icon="mdi-information-outline" size="22" />
      <p>Untuk MVP satu sekolah dipegang paling banyak satu agent (porsi 100%). Saat dipindah, penugasan lama ditutup dan tetap tersimpan di riwayat.</p>
    </div>

    <div class="tugas__grid">
      <v-card class="tugas__agents">
        <h2 class="tugas__h">Agent</h2>
        <ul class="tugas__list">
          <li v-for="s in perAgent" :key="s.agent.id">
            <button type="button" class="tugas__agent" :class="{ 'tugas__agent--on': s.agent.id === selectedId }" :aria-pressed="s.agent.id === selectedId" @click="selectedId = s.agent.id">
              <span class="tugas__avatar">{{ initials(s.agent.name) }}</span>
              <span class="tugas__agent-text">
                <strong>{{ s.agent.name }}</strong>
                <small>{{ s.agent.timezone }} • {{ s.rows.length }} sekolah</small>
              </span>
              <v-icon icon="mdi-chevron-right" size="20" />
            </button>
          </li>
        </ul>
        <button type="button" class="tugas__none" @click="unassignedSection?.scrollIntoView({ behavior: 'smooth', block: 'center' })">
          <span class="tugas__warn"><v-icon icon="mdi-alert-outline" size="22" /></span>
          <span class="tugas__agent-text"><strong>Sekolah tanpa agent</strong><small>Belum ada penanggung jawab</small></span>
          <span class="tugas__badge" data-testid="unassigned-count">{{ unassigned.length }}</span>
        </button>
      </v-card>

      <v-card v-if="selected" class="tugas__detail">
        <header class="tugas__head">
          <div>
            <h2 class="tugas__h">Sekolah {{ selected.agent.name }}</h2>
            <p class="tugas__sub">{{ selected.rows.length }} sekolah ditugaskan • retention 2026: {{ formatPercent(selected.agent.retention2026) }}</p>
          </div>
          <v-btn prepend-icon="mdi-plus" @click="openAssign(null)">Tugaskan sekolah</v-btn>
        </header>
        <div v-if="selected.rows.length" class="tugas__table">
          <table>
            <thead><tr><th>Sekolah</th><th class="c-period">Kontrak berjalan</th><th class="c-share">Porsi</th><th class="c-since">Sejak</th><th class="c-act" /></tr></thead>
            <tbody>
              <tr v-for="e in selected.rows" :key="e.assignment.id" data-testid="assignment-row">
                <td><p class="tugas__name">{{ e.row.school.name }}</p><p class="tugas__npsn">NPSN {{ e.row.school.npsn }}</p></td>
                <td>{{ e.row.contract ? formatPeriod(e.row.contract.start, e.row.contract.end) : '–' }}</td>
                <td class="c-share">{{ e.assignment.sharePercent }}%</td>
                <td>{{ formatDay(e.assignment.assignedAt) }}</td>
                <td class="c-act">
                  <button type="button" class="tugas__move" :aria-label="`Pindahkan ${e.row.school.name}`" @click="openMove(e)">
                    <v-icon icon="mdi-swap-horizontal" size="16" />Pindahkan
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyState v-else title="Belum ada sekolah" description="Agent ini belum memegang sekolah. Tugaskan dari daftar sekolah tanpa agent." icon="mdi-school-outline" />
      </v-card>
    </div>

    <v-card ref="unassignedSection" class="tugas__unassigned">
      <h2 class="tugas__h">Sekolah tanpa agent</h2>
      <p class="tugas__sub tugas__sub--gap">Sekolah ini belum punya penanggung jawab</p>
      <div v-if="unassigned.length" class="tugas__cards">
        <div v-for="r in unassigned" :key="r.school.id" class="tugas__item" data-testid="unassigned-row">
          <div>
            <p class="tugas__name">{{ r.school.name }}</p>
            <p class="tugas__npsn">Kontrak s.d. {{ r.contract ? formatDay(r.contract.end) : '–' }}</p>
          </div>
          <v-btn variant="outlined" :aria-label="`Tugaskan ${r.school.name}`" @click="openAssign(r)">Tugaskan</v-btn>
        </div>
      </div>
      <p v-else class="tugas__sub">Semua sekolah sudah punya agent.</p>
    </v-card>

    <MoveDialog v-model="moveOpen" :target="moveTarget" :current="moveCurrent" :agents="listAgents()" :choices="moveChoices" :default-agent-id="moveCurrent ? null : selectedId" @submit="onSubmit" />
    <v-snackbar v-model="snack.show" :timeout="3500" color="primary" location="bottom">{{ snack.text }}</v-snackbar>
  </div>
</template>

<style scoped>
.tugas { display: flex; flex-direction: column; gap: 24px; }
.tugas__info { display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 16px; border-radius: 8px; background: rgb(var(--v-theme-info-surface)); color: rgb(var(--v-theme-info)); font-size: 14px; }
.tugas__grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; align-items: start; }
.tugas__agents, .tugas__detail, .tugas__unassigned { padding: 24px; }
.tugas__h { font-size: 16px; line-height: 24px; font-weight: 600; }
.tugas__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.tugas__sub--gap { margin-bottom: 16px; }
.tugas__list { display: flex; flex-direction: column; gap: 4px; margin: 4px 0 8px; list-style: none; padding: 0; }
.tugas__agent, .tugas__none { display: flex; align-items: center; gap: 12px; width: 100%; padding: 11px 12px; border-radius: 8px; text-align: left; color: rgb(var(--v-theme-text-secondary)); }
.tugas__agent--on { background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-primary)); }
.tugas__agent--on strong { color: rgb(var(--v-theme-primary)); }
.tugas__avatar {
  display: inline-flex; align-items: center; justify-content: center; flex: none; width: 40px; height: 40px; border-radius: 999px;
  background: rgb(var(--v-theme-brand-soft)); color: rgb(var(--v-theme-secondary)); font-size: 13px; font-weight: 600;
}
.tugas__agent--on .tugas__avatar { background: rgb(var(--v-theme-brand-soft)); }
.tugas__agent-text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.tugas__agent-text strong { font-size: 14px; line-height: 20px; font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.tugas__agent-text small { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.tugas__none { border: 1px solid rgb(var(--v-theme-border)); }
.tugas__warn { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 40px; height: 40px; border-radius: 999px; background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); }
.tugas__badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; background: rgb(var(--v-theme-warning-surface)); color: rgb(var(--v-theme-warning)); font-size: 13px; font-weight: 600; }
.tugas__head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.tugas__table { border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
.tugas__table table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 14px; }
.tugas__table th { height: 47px; padding: 0 16px; text-align: left; font-size: 13px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); background: rgb(var(--v-theme-canvas-table)); }
.tugas__table td { height: 64px; padding: 0 16px; border-top: 1px solid rgb(var(--v-theme-border-subtle)); }
.tugas__table .c-period { width: 216px; } .tugas__table .c-share { width: 64px; text-align: right; padding-left: 0; } .tugas__table .c-since { width: 132px; padding-left: 16px; } .tugas__table .c-act { width: 129px; text-align: right; }
.tugas__name { font-size: 14px; line-height: 20px; font-weight: 600; }
.tugas__npsn { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.tugas__move { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; line-height: 18px; font-weight: 600; color: rgb(var(--v-theme-primary)); border-radius: 5px; }
.tugas__table .tugas__name { font-weight: 500; }
.tugas__cards { padding-right: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.tugas__item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: 8px; background: rgb(var(--v-theme-background)); }
</style>
