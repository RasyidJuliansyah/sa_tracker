<script setup lang="ts">
import { ref } from 'vue'
import DialogShell from '@/components/admin/DialogShell.vue'
import StatusChip from '@/components/StatusChip.vue'
import { TARGET_PERCENT, type DashAgent } from '@/mocks/dashboard'
import { formatPercent } from '@/utils/format'
import TargetBar from './TargetBar.vue'

// Peringkat agent menurut persentase retention tahunan. Kartu bisa dibuka (Rincian) untuk melihat ringkasan agent.
defineProps<{ agents: DashAgent[]; year: number }>()
const detail = ref<DashAgent | null>(null)
const open = ref(false)
const met = (a: DashAgent) => a.met
const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2)
function show(a: DashAgent) { detail.value = a; open.value = true }
</script>

<template>
  <v-card class="rank">
    <h2 class="rank__title">Peringkat agent</h2>
    <p class="rank__sub">Urut persentase retention {{ year }} • klik kartu untuk rincian</p>
    <div class="rank__grid">
      <article v-for="(a, i) in agents" :key="a.id" class="rank__card" :data-testid="`rank-${a.id}`">
        <header class="rank__who">
          <span class="rank__no">#{{ i + 1 }}</span>
          <span class="rank__avatar" aria-hidden="true">{{ initials(a.name) }}</span>
          <div>
            <p class="rank__name">{{ a.name }}</p>
            <p class="rank__meta">{{ a.timezone }} • {{ a.schools }} sekolah</p>
          </div>
        </header>
        <div class="rank__value">
          <strong>{{ formatPercent(a.retentionPct) }}</strong>
          <StatusChip :label="met(a) ? 'Sesuai target' : 'Di bawah target'" :tone="met(a) ? 'success' : 'error'" />
        </div>
        <TargetBar :percent="a.retentionPct" :target="TARGET_PERCENT" :color="met(a) ? 'success-solid' : 'error-solid'" :height="8" />
        <p class="rank__meta">Rp {{ a.retainedJt }} jt dari Rp {{ a.cohortJt }} jt</p>
        <footer class="rank__foot">
          <span>{{ a.visits }} kunjungan • {{ a.unvisited }} belum dikunjungi minggu ini</span>
          <button type="button" class="rank__link" :aria-label="`Rincian ${a.name}`" @click="show(a)">Rincian <v-icon icon="mdi-chevron-right" size="16" /></button>
        </footer>
      </article>
    </div>
    <p v-if="!agents.length" class="rank__meta">Pilih minimal satu agent.</p>
    <DialogShell v-model="open" :title="detail?.name ?? ''" :subtitle="`Retention ${year} • ${detail?.timezone} • ${detail?.schools} sekolah`" :width="480" :top="160">
      <dl v-if="detail" class="rank__dl">
        <div><dt>Retention</dt><dd>{{ formatPercent(detail.retentionPct) }} (target {{ TARGET_PERCENT }}%)</dd></div>
        <div><dt>Perpanjangan ditandatangani</dt><dd>Rp {{ detail.retainedJt }} jt</dd></div>
        <div><dt>Nilai kontrak kohort</dt><dd>Rp {{ detail.cohortJt }} jt</dd></div>
        <div><dt>Kunjungan periode ini</dt><dd>{{ detail.visits }}</dd></div>
        <div><dt>Sekolah belum dikunjungi</dt><dd>{{ detail.unvisited }}</dd></div>
      </dl>
      <div class="rank__actions"><v-btn variant="outlined" to="/rekap">Buka rekap kunjungan</v-btn></div>
    </DialogShell>
  </v-card>
</template>

<style scoped>
.rank { padding: 24px; display: flex; flex-direction: column; gap: 4px; }
.rank__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.rank__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); margin-bottom: 12px; }
.rank__grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.rank__card { display: flex; flex-direction: column; gap: 12px; padding: 20px; border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; }
.rank__who { display: flex; align-items: center; gap: 12px; }
.rank__no { font-size: 14px; font-weight: 600; color: rgb(var(--v-theme-text-secondary)); }
.rank__avatar { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 999px; background: rgb(var(--v-theme-brand-soft)); color: rgb(var(--v-theme-secondary)); font-size: 13px; font-weight: 500; }
.rank__name { font-size: 14px; line-height: 20px; font-weight: 600; }
.rank__meta { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.rank__value { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.rank__value strong { font-size: 24px; line-height: 32px; font-weight: 600; }
.rank__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid rgb(var(--v-theme-border)); font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.rank__link { display: inline-flex; align-items: center; flex: none; font-size: 13px; font-weight: 600; color: rgb(var(--v-theme-primary)); border-radius: 5px; }
.rank__dl div { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); font-size: 14px; }
.rank__dl dt { color: rgb(var(--v-theme-text-secondary)); }
.rank__dl dd { font-weight: 600; margin: 0; }
.rank__actions { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
