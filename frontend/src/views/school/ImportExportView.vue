<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import ExportPanel from '@/components/school/ExportPanel.vue'
import ImportPanel from '@/components/school/ImportPanel.vue'
import SchoolTabs from '@/components/school/SchoolTabs.vue'

// Impor & ekspor (Figma 23:596 pratinjau impor dan 23:911 ekspor). Hanya admin dan manager.
const route = useRoute()
const tabs = [{ value: 'impor', label: 'Impor CSV' }, { value: 'ekspor', label: 'Ekspor CSV' }]
const tab = ref(route.query.tab === 'ekspor' ? 'ekspor' : 'impor')
</script>

<template>
  <div class="ie">
    <SchoolTabs v-model="tab" :tabs="tabs" label="Impor atau ekspor" />
    <ImportPanel v-if="tab === 'impor'" />
    <ExportPanel v-else />
  </div>
</template>

<style scoped>
.ie { display: flex; flex-direction: column; gap: 24px; }
</style>
