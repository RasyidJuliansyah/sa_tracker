<script setup lang="ts">
import StatusChip, { type ChipTone } from '@/components/StatusChip.vue'
import type { MockAuditEntry } from '@/mocks/admin'

// Panel "Rincian perubahan" di kanan tabel audit log (Figma 25:1265). Hanya baca.
defineProps<{ entry: MockAuditEntry | null; whenLabel: string; actionLabel: string; actionTone: ChipTone }>()
</script>

<template>
  <v-card class="detail" aria-label="Rincian perubahan" role="region">
    <template v-if="entry">
      <header>
        <h2 class="detail__title">Rincian perubahan</h2>
        <p class="detail__sub">{{ whenLabel }}</p>
      </header>
      <div class="detail__row"><span class="detail__key">Pelaku</span><span class="detail__value">{{ entry.actor }} ({{ entry.actorRole }})</span></div>
      <div class="detail__row"><span class="detail__key">Aksi</span><StatusChip :label="actionLabel" :tone="actionTone" /></div>
      <div class="detail__row">
        <span class="detail__key">Data</span>
        <span class="detail__value">{{ [entry.tableName, entry.recordIds].filter(Boolean).join(' ') }}</span>
      </div>
      <template v-if="entry.changes.length">
        <p class="detail__heading">Sebelum → sesudah</p>
        <div v-for="c in entry.changes" :key="c.field" class="detail__change">
          <p class="detail__field">{{ c.field }}</p>
          <div class="detail__diff">
            <span class="detail__before">{{ c.before ?? '–' }}</span>
            <v-icon icon="mdi-chevron-right" size="16" />
            <span class="detail__after">{{ c.after ?? '–' }}</span>
          </div>
        </div>
      </template>
      <p v-else class="detail__empty">Tidak ada perubahan kolom yang dicatat untuk aksi ini.</p>
      <p class="detail__note">Baris audit log tidak bisa diubah atau dihapus.</p>
    </template>
    <div v-else class="detail__placeholder">
      <v-icon icon="mdi-history" size="32" />
      <p>Pilih satu baris untuk melihat rincian perubahan.</p>
    </div>
  </v-card>
</template>

<style scoped>
.detail { display: flex; flex-direction: column; gap: 16px; padding: 24px; width: 420px; flex: none; }
.detail__title { font-size: 16px; line-height: 24px; font-weight: 600; }
.detail__sub { margin-top: 2px; font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.detail__row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgb(var(--v-theme-border)); font-size: 14px; line-height: 20px; }
.detail__key { width: 110px; flex: none; color: rgb(var(--v-theme-text-secondary)); }
.detail__value { flex: 1; font-weight: 500; }
.detail__heading { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.detail__change { display: flex; flex-direction: column; gap: 6px; padding: 12px; border-radius: 8px; background: rgb(var(--v-theme-background)); }
.detail__field { font-size: 13px; line-height: 18px; font-weight: 500; color: rgb(var(--v-theme-text-secondary)); }
.detail__diff { display: flex; align-items: center; gap: 8px; font-size: 14px; line-height: 20px; flex-wrap: wrap; }
.detail__before, .detail__after { padding: 2px 6px; border-radius: 4px; }
.detail__before { background: rgb(var(--v-theme-error-surface)); color: rgb(var(--v-theme-error)); }
.detail__after { background: rgb(var(--v-theme-success-surface)); color: rgb(var(--v-theme-success)); }
.detail__empty, .detail__note { font-size: 12px; line-height: 16px; color: rgb(var(--v-theme-text-secondary)); }
.detail__placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 0; text-align: center; font-size: 14px; color: rgb(var(--v-theme-text-secondary)); }
</style>
