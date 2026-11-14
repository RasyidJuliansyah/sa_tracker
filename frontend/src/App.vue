<script setup lang="ts">
import { computed } from 'vue'
import { apiErrorMessage } from '@/services/http'

const open = computed({ get: () => !!apiErrorMessage.value, set: (v) => { if (!v) apiErrorMessage.value = '' } })
</script>

<template>
  <v-app>
    <router-view />
    <v-snackbar v-model="open" color="error" :timeout="5000" role="alert" data-testid="api-error">{{ apiErrorMessage }}</v-snackbar>
  </v-app>
</template>
