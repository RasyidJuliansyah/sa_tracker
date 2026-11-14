<script setup lang="ts">
// Rangka dialog admin: kartu 24px padding, judul + subjudul + tombol tutup. Esc dan klik latar menutup.
const props = defineProps<{ title: string; subtitle?: string; width?: number; top?: number }>()
const open = defineModel<boolean>({ default: false })
</script>

<template>
  <v-dialog v-model="open" class="dialog-root" :aria-label="title" :width="width ?? 540" scrim="text" :content-props="{ style: { marginTop: `${props.top ?? 120}px` } }">
    <v-card class="dialog-shell" rounded="lg">
      <header class="dialog-shell__head">
        <div>
          <h2 class="dialog-shell__title">{{ title }}</h2>
          <p v-if="subtitle" class="dialog-shell__subtitle">{{ subtitle }}</p>
        </div>
        <button type="button" class="dialog-shell__close" aria-label="Tutup dialog" @click="open = false">
          <v-icon icon="mdi-close" size="24" />
        </button>
      </header>
      <slot />
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-shell { padding: 24px; border: 0; }
.dialog-shell__head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.dialog-shell__title { font-size: 20px; line-height: 28px; font-weight: 600; }
.dialog-shell__subtitle { margin-top: 2px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.dialog-shell__close { display: inline-flex; margin: 4px 4px 0 0; border-radius: 5px; color: rgb(var(--v-theme-text-secondary)); }
</style>

<style>
.dialog-root.v-overlay { align-items: flex-start; }
.dialog-root .v-overlay__scrim { opacity: 0.45 !important; }
.dialog-root .v-overlay__content { margin-top: 0; }
</style>
