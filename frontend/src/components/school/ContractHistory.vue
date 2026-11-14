<script setup lang="ts">
import StatusChip from '@/components/StatusChip.vue'
import type { MockContract } from '@/mocks/school'
import { formatPercent, formatRupiah } from '@/utils/format'
import { renewalOf, renewalRatio } from './contract-rules'
import { formatDay, formatPeriod } from './school-format'

// Riwayat kontrak (Figma 22:669): retention = nilai perpanjangan ÷ nilai kontrak, tidak dibatasi 100%.
// Angka ditampilkan dari data tiruan; rumus kohort tahunan ada di backend.
defineProps<{ contracts: MockContract[] }>()
</script>

<template>
  <div class="history">
    <table class="history__table">
      <thead>
        <tr>
          <th>Kontrak</th>
          <th class="history__periode">Periode</th>
          <th class="history__num">Nilai kontrak</th>
          <th class="history__num">Perpanjangan</th>
          <th class="history__ret">Retention</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in contracts" :key="c.id" data-testid="contract-row">
          <td class="history__name">
            <p class="history__title">{{ c.label }}</p>
            <p class="history__sub">{{ c.note ? `${c.note} • ${formatDay(c.signedDate)}` : `Ditandatangani ${formatDay(c.signedDate)}` }}</p>
          </td>
          <td class="history__periode">{{ formatPeriod(c.start, c.end) }}</td>
          <td class="history__num">{{ formatRupiah(c.value) }}</td>
          <td class="history__num">{{ renewalOf(c, contracts) ? formatRupiah(renewalOf(c, contracts)!.value) : '–' }}</td>
          <td class="history__ret">
            <StatusChip v-if="!renewalOf(c, contracts)" label="Belum ada" />
            <span
              v-else class="history__ratio"
              :class="{ 'history__ratio--up': renewalRatio(renewalOf(c, contracts)!.value, c.value) > 100 }"
            >{{ formatPercent(renewalRatio(renewalOf(c, contracts)!.value, c.value)) }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.history { border: 1px solid rgb(var(--v-theme-border)); border-radius: 8px; overflow: hidden; }
.history__table { width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 14px; }
.history th {
  height: 47px; padding: 0 16px; text-align: left; font-size: 13px; font-weight: 500;
  color: rgb(var(--v-theme-text-secondary)); background: rgb(var(--v-theme-canvas-table));
}
.history td { height: 64px; padding: 0 16px; border-top: 1px solid rgb(var(--v-theme-border-subtle)); }
.history__periode { width: 171px; white-space: nowrap; }
.history__num { width: 140px; text-align: right !important; white-space: nowrap; }
.history__ret { width: 111px; text-align: right !important; }
.history__name { overflow: hidden; }
.history__title { font-size: 14px; line-height: 20px; font-weight: 600; }
.history__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); white-space: nowrap; overflow: hidden; text-overflow: clip; }
.history__ratio { font-weight: 600; }
.history__ratio--up { color: rgb(var(--v-theme-success)); }
</style>
