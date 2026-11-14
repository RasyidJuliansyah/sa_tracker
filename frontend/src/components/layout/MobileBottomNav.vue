<script setup lang="ts">
import { agentNav } from '@/utils/navigation'

// Navigasi bawah HP (Figma: HP/Nav bawah). Tinggi 64px, item aktif brand-strong bobot 600.
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigasi utama">
    <router-link v-for="item in agentNav" :key="item.to" v-slot="{ href, navigate, isActive }" :to="item.to" custom>
      <a :href="href" class="bottom-nav__item" :class="{ 'bottom-nav__item--active': isActive }" :aria-current="isActive ? 'page' : undefined" @click="navigate">
        <v-icon :icon="item.icon" size="24" />
        <span>{{ item.label }}</span>
      </a>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  height: 64px;
  background: rgb(var(--v-theme-surface));
  border-top: 1px solid rgb(var(--v-theme-border));
}
.bottom-nav__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  font-size: 12px;
  line-height: 16px;
  color: rgb(var(--v-theme-text-secondary));
  text-decoration: none;
}
.bottom-nav__item--active {
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
}
</style>
