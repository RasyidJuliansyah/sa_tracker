<script setup lang="ts">
// Halaman sementara untuk memeriksa tema, locale, dan font. Diganti oleh layout asli di langkah 5.
const headers = [
  { title: 'Sekolah', key: 'school' },
  { title: 'Status', key: 'status' },
]
const items = [{ school: 'SMA Contoh', status: 'Aktif' }]
</script>

<template>
  <v-container>
    <v-card class="pa-6" data-testid="setup-card">
      <h1 class="text-h6 mb-4">SA Visit Tracker</h1>
      <div class="d-flex ga-3 mb-4">
        <v-btn data-testid="btn-primary">Check-in</v-btn>
        <v-chip color="success-surface" class="text-success-text">Aktif</v-chip>
      </div>
      <v-text-field label="Nama sekolah" data-testid="field" />
      <v-data-table :headers="headers" :items="items" data-testid="table" />
    </v-card>
  </v-container>
</template>
