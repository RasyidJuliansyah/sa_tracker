<script setup lang="ts">
// Field teks dengan label di atas (docs/design-system/skolla-lms/components/Input.md).
// Label 13px bobot 500, jarak 6px ke field. Pesan galat di bawah field memakai warna error-text.
defineProps<{
  label: string
  id: string
  errorMessages?: string | string[]
}>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <div class="labeled-field">
    <label :for="id" class="labeled-field__label">{{ label }}</label>
    <v-text-field
      :id="id"
      v-model="model"
      :error-messages="errorMessages"
      hide-details="auto"
      v-bind="$attrs"
    >
      <template v-for="(_, slot) in $slots" #[slot]="scope">
        <slot :name="slot" v-bind="scope ?? {}" />
      </template>
    </v-text-field>
  </div>
</template>

<style scoped>
.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.labeled-field__label {
  font-size: 13px;
  line-height: 18px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}
</style>
