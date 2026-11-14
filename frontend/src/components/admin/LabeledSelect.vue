<script setup lang="ts">
// Select dengan label di atas, pasangan LabeledField (label 13px bobot 500, jarak 6px).
defineProps<{ label: string; id: string; items: { title: string; value: string | null }[]; errorMessages?: string | string[] }>()
const model = defineModel<string | null>({ default: null })
</script>

<template>
  <div class="labeled-select">
    <label :for="id" class="labeled-select__label">{{ label }}</label>
    <v-select :id="id" v-model="model" :items="items" :error-messages="errorMessages" hide-details="auto" menu-icon="mdi-chevron-down" v-bind="$attrs" />
  </div>
</template>

<style scoped>
.labeled-select { display: flex; flex-direction: column; gap: 6px; }
.labeled-select__label { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-on-surface)); }

.labeled-select :deep(.v-field__input input::placeholder),
.labeled-select :deep(.v-field__input) { opacity: 1; }
</style>
