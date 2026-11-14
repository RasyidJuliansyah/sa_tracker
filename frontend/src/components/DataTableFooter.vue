<script setup lang="ts">
import { computed } from 'vue'

// Footer tabel (Figma: Tabel/Footer). Dipakai di slot #bottom VDataTable:
// <DataTableFooter v-model:page="page" v-model:items-per-page="perPage" :total="items.length" />
const props = defineProps<{ total: number; page: number; itemsPerPage: number }>()
const emit = defineEmits<{ 'update:page': [number]; 'update:itemsPerPage': [number] }>()

const options = [10, 25, 50]
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.itemsPerPage)))
const range = computed(() => {
  if (props.total === 0) return '0 dari 0'
  const from = (props.page - 1) * props.itemsPerPage + 1
  const to = Math.min(props.page * props.itemsPerPage, props.total)
  return `${from}–${to} dari ${props.total}`
})
function setPerPage(n: number) {
  emit('update:itemsPerPage', n)
  emit('update:page', 1)
}
</script>

<template>
  <div class="table-footer">
    <span class="table-footer__muted">Baris per halaman</span>
    <v-menu>
      <template #activator="{ props: menu }">
        <button v-bind="menu" type="button" class="table-footer__select" aria-label="Baris per halaman">
          {{ itemsPerPage }}
          <v-icon icon="mdi-chevron-down" size="18" />
        </button>
      </template>
      <v-list density="compact">
        <v-list-item v-for="n in options" :key="n" :title="String(n)" @click="setPerPage(n)" />
      </v-list>
    </v-menu>
    <span class="table-footer__spacer" />
    <span class="table-footer__muted">{{ range }}</span>
    <button type="button" class="table-footer__nav" aria-label="Halaman sebelumnya" :disabled="page <= 1" @click="emit('update:page', page - 1)">
      <v-icon icon="mdi-chevron-left" size="22" />
    </button>
    <button type="button" class="table-footer__nav" aria-label="Halaman berikutnya" :disabled="page >= pageCount" @click="emit('update:page', page + 1)">
      <v-icon icon="mdi-chevron-right" size="22" />
    </button>
  </div>
</template>

<style scoped>
.table-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 52px;
  padding: 0 16px;
  background: rgb(var(--v-theme-surface));
}
.table-footer__muted {
  font-size: 12px;
  line-height: 16px;
  color: rgb(var(--v-theme-text-secondary));
  white-space: nowrap;
}
.table-footer__select {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 5px;
}
.table-footer__spacer { flex: 1; }
.table-footer__nav {
  display: inline-flex;
  border-radius: 5px;
  color: rgb(var(--v-theme-on-surface));
}
.table-footer__nav:disabled { color: rgb(var(--v-theme-text-disabled)); cursor: default; }
</style>
