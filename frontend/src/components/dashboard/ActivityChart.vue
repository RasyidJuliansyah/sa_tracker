<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import VueApexCharts from 'vue3-apexcharts'
import type { ChartData, ChartTab } from '@/mocks/dashboard'

// Grafik batang berkelompok: periode ini dibanding periode sebelumnya. Warna dari token chart-1 dan chart-3.
const props = defineProps<{ data: ChartData }>()
const tab = defineModel<ChartTab>('tab', { required: true })
const theme = useTheme()
const color = (name: string) => theme.current.value.colors[name] as string

const tabs: { key: ChartTab; label: string }[] = [
  { key: 'renewal', label: 'Perpanjangan' },
  { key: 'visits', label: 'Kunjungan' },
  { key: 'duration', label: 'Durasi' },
]
const series = computed(() => [
  { name: 'Sebelumnya', data: props.data.before },
  { name: 'Periode ini', data: props.data.now },
])
const options = computed(() => ({
  chart: { type: 'bar' as const, toolbar: { show: false }, fontFamily: 'Rubik, system-ui, sans-serif', animations: { enabled: false }, zoom: { enabled: false } },
  colors: [color('chart-3'), color('chart-1')],
  plotOptions: { bar: { columnWidth: props.data.labels.length > 12 ? '70%' : '48%', borderRadius: 2 } },
  dataLabels: { enabled: false },
  stroke: { show: true, width: 2, colors: ['transparent'] },
  legend: { show: false },
  grid: { borderColor: color('canvas-alt'), strokeDashArray: 0, xaxis: { lines: { show: false } } },
  xaxis: {
    categories: props.data.labels,
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { fontSize: '12px', colors: props.data.labels.map((_, i) => (i === props.data.todayIndex ? color('secondary') : color('text-secondary'))) } },
  },
  yaxis: { min: 0, max: props.data.max, tickAmount: 3, labels: { style: { fontSize: '12px', colors: color('text-secondary') } } },
  tooltip: { y: { formatter: (v: number) => `${v} ${props.data.unit}` } },
}))
</script>

<template>
  <v-card class="chart">
    <header class="chart__head">
      <div>
        <h2 class="chart__title">{{ data.title }}</h2>
        <p class="chart__sub">{{ data.subtitle }}</p>
      </div>
      <div class="chart__tabs" role="tablist" aria-label="Jenis grafik">
        <button v-for="t in tabs" :key="t.key" type="button" role="tab" class="chart__tab" :class="{ 'chart__tab--active': tab === t.key }" :aria-selected="tab === t.key" @click="tab = t.key">{{ t.label }}</button>
      </div>
    </header>
    <VueApexCharts type="bar" height="290" :options="options" :series="series" />
    <ul class="chart__legend">
      <li><span class="chart__dot" :style="{ background: `rgb(var(--v-theme-chart-1))` }" />{{ data.nowLegend }}</li>
      <li><span class="chart__dot" :style="{ background: `rgb(var(--v-theme-chart-3))` }" />{{ data.beforeLegend }}</li>
    </ul>
  </v-card>
</template>

<style scoped>
.chart { display: flex; flex-direction: column; gap: 8px; padding: 24px; height: 100%; }
.chart__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.chart__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.chart__sub { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.chart__tabs { display: flex; gap: 4px; }
.chart__tab { padding: 6px 14px; border-radius: 999px; font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.chart__tab--active { background: rgb(var(--v-theme-brand-softer)); color: rgb(var(--v-theme-secondary)); font-weight: 600; }
.chart__legend { display: flex; gap: 20px; list-style: none; margin: 0; padding: 0; font-size: 12px; line-height: 16px; }
.chart__legend li { display: flex; align-items: center; gap: 6px; }
.chart__dot { width: 10px; height: 10px; border-radius: 999px; }
</style>
