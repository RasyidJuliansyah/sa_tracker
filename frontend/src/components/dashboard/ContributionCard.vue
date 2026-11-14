<script setup lang="ts">
import type { DashAgent } from '@/mocks/dashboard'
import { formatPercent } from '@/utils/format'

// Kontribusi retention per agent: bilah bertumpuk terhadap target (Rp 806 jt) dan rincian per agent.
const props = defineProps<{ agents: DashAgent[]; targetJt: number; retainedJt: number }>()
const sum = () => props.agents.reduce((a, x) => a + x.retainedJt, 0)
const remaining = () => Math.max(0, props.targetJt - sum())
const share = (a: DashAgent) => (props.agents.length === 3 ? a.contributionPct : (a.retainedJt / (sum() || 1)) * 100)
</script>

<template>
  <v-card class="contrib">
    <h2 class="contrib__title">Kontribusi retention per agent</h2>
    <p class="contrib__sub">Rp {{ sum() }} jt dari target Rp {{ targetJt }} jt</p>
    <div class="contrib__bar" role="img" :aria-label="`Kontribusi retention: Rp ${sum()} jt dari target Rp ${targetJt} jt`">
      <span v-for="a in agents" :key="a.id" :style="{ width: `${(a.retainedJt / targetJt) * 100}%`, background: `rgb(var(--v-theme-${a.seriesColor}))` }" />
    </div>
    <p class="contrib__rest">Sisa menuju target: Rp {{ remaining() }} jt</p>
    <ul class="contrib__list">
      <li v-for="a in agents" :key="a.id" class="contrib__row">
        <span class="contrib__dot" :style="{ background: `rgb(var(--v-theme-${a.seriesColor}))` }" />
        <span class="contrib__name">{{ a.name }}</span>
        <b>Rp {{ a.retainedJt }} jt</b>
        <span class="contrib__pct">{{ formatPercent(share(a)) }}</span>
      </li>
    </ul>
  </v-card>
</template>

<style scoped>
.contrib { display: flex; flex-direction: column; gap: 8px; padding: 24px; height: 100%; }
.contrib__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.contrib__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.contrib__bar { display: flex; height: 16px; margin-top: 8px; border-radius: 999px; overflow: hidden; background: rgb(var(--v-theme-canvas-alt)); }
.contrib__rest { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); margin-bottom: 8px; }
.contrib__list { list-style: none; margin: 0; padding: 0; }
.contrib__row { display: flex; align-items: center; gap: 12px; padding: 14px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); font-size: 14px; }
.contrib__dot { width: 10px; height: 10px; border-radius: 999px; flex: none; }
.contrib__name { flex: 1; }
.contrib__pct { width: 48px; text-align: right; font-size: 12px; color: rgb(var(--v-theme-text-secondary)); }
</style>
