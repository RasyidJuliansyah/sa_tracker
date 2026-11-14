<script setup lang="ts">
import StatusChip from '@/components/StatusChip.vue'
import { TARGET_PERCENT, type annualRetention } from '@/mocks/dashboard'
import TargetBar from './TargetBar.vue'
import { formatPercent } from '@/utils/format'

// Retention tahunan: tidak ikut pilihan periode (docs/PLAN.md, "Retention dan target").
defineProps<{ data: typeof annualRetention }>()
</script>

<template>
  <v-card class="ret">
    <header class="ret__head">
      <div>
        <h2 class="ret__title">Retention {{ data.year }}</h2>
        <p class="ret__sub">Kohort: kontrak yang tanggal berakhirnya jatuh di {{ data.year }}</p>
      </div>
      <StatusChip :label="data.status === 'MET' ? 'Sesuai target' : 'Di bawah target'" :tone="data.status === 'MET' ? 'success' : 'error'" />
    </header>
    <p class="ret__big"><strong>{{ formatPercent(data.percent) }}</strong><span>dari nilai kontrak kohort • target {{ TARGET_PERCENT }}%</span></p>
    <TargetBar :percent="data.percent" :target="TARGET_PERCENT" color="primary" />
    <div class="ret__boxes">
      <div class="ret__box"><span>Perpanjangan ditandatangani</span><b>Rp {{ data.retainedJt }} jt</b></div>
      <div class="ret__box"><span>Target ({{ TARGET_PERCENT }}%)</span><b>Rp {{ data.targetJt }} jt</b></div>
      <div class="ret__box"><span>Nilai kontrak kohort</span><b>{{ data.cohortLabel }}</b></div>
    </div>
    <h3 class="ret__breakdown-title">Rincian kohort {{ data.year }}</h3>
    <ul class="ret__rows">
      <li v-for="r in data.breakdown" :key="r.key" class="ret__row">
        <span class="ret__dot" :style="{ background: `rgb(var(--v-theme-${r.dot}))` }" />
        <span class="ret__row-label">{{ r.label }}</span>
        <span class="ret__row-count">{{ r.contracts }} kontrak</span>
        <b class="ret__row-amount">{{ r.amountLabel }}</b>
      </li>
    </ul>
    <p class="ret__note"><v-icon icon="mdi-information-outline" size="16" />{{ data.decisionNote }}</p>
  </v-card>
</template>

<style scoped>
.ret { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.ret__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ret__title { font-size: 18px; line-height: 28px; font-weight: 600; }
.ret__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.ret__big { display: flex; align-items: baseline; gap: 12px; }
.ret__big strong { font-size: 28px; line-height: 36px; font-weight: 600; }
.ret__big span { font-size: 14px; color: rgb(var(--v-theme-text-secondary)); }
.ret__boxes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.ret__box { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-radius: 8px; background: rgb(var(--v-theme-canvas-table)); }
.ret__box span { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.ret__box b { font-size: 16px; line-height: 24px; font-weight: 600; }
.ret__breakdown-title { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.ret__rows { list-style: none; margin: 0; padding: 0; }
.ret__row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); font-size: 14px; }
.ret__row:last-child { border-bottom: 0; }
.ret__dot { width: 10px; height: 10px; border-radius: 999px; flex: none; }
.ret__row-label { flex: 1; }
.ret__row-count { width: 80px; text-align: right; font-size: 12px; color: rgb(var(--v-theme-text-secondary)); }
.ret__row-amount { width: 90px; text-align: right; font-weight: 600; }
.ret__note { display: flex; align-items: center; gap: 8px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
</style>
