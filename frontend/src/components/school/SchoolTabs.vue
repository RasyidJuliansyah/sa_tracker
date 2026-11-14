<script setup lang="ts">
// Tab halaman (garis bawah brand pada tab aktif). Dipakai halaman sekolah dan Impor & ekspor.
defineProps<{ tabs: { value: string; label: string }[]; label: string }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="school-tabs" role="tablist" :aria-label="label">
    <button
      v-for="t in tabs" :key="t.value" type="button" role="tab" class="school-tabs__tab"
      :class="{ 'school-tabs__tab--active': model === t.value }" :aria-selected="model === t.value" @click="model = t.value"
    >{{ t.label }}</button>
  </div>
</template>

<style scoped>
.school-tabs { display: flex; gap: 8px; border-bottom: 1px solid rgb(var(--v-theme-border)); }
.school-tabs__tab {
  height: 48px;
  padding: 0 16px;
  margin-bottom: -1px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: rgb(var(--v-theme-text-secondary));
  border-bottom: 2px solid transparent;
}
.school-tabs__tab--active { color: rgb(var(--v-theme-primary)); font-weight: 600; border-bottom-color: rgb(var(--v-theme-primary)); }
</style>
