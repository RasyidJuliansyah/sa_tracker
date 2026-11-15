<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import SchoolTabs from '@/components/school/SchoolTabs.vue'
import AccountImportPanel from '@/components/admin/AccountImportPanel.vue'
import AccountExportPanel from '@/components/admin/AccountExportPanel.vue'

// Impor & ekspor akun (pola sama dengan impor/ekspor sekolah). Hanya admin.
const route = useRoute()
const tabs = [{ value: 'impor', label: 'Impor CSV' }, { value: 'ekspor', label: 'Ekspor CSV' }]
const tab = ref(route.query.tab === 'ekspor' ? 'ekspor' : 'impor')
</script>

<template>
  <div class="ie">
    <SchoolTabs v-model="tab" :tabs="tabs" label="Impor atau ekspor akun" />
    <AccountImportPanel v-if="tab === 'impor'" />
    <AccountExportPanel v-else />
  </div>
</template>

<style scoped>
.ie { display: flex; flex-direction: column; gap: 24px; }
</style>
