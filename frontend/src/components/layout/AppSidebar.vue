<script setup lang="ts">
import BrandLogo from "@/components/BrandLogo.vue";
import { useRoute } from "vue-router";
import type { NavItem } from "@/utils/navigation";

// Sidebar desktop (Figma: Sidebar/Manager dan Sidebar/Admin). Lebar 220px.
defineProps<{ items: NavItem[] }>();
defineEmits<{ logout: [] }>();

const route = useRoute();
const active = (item: NavItem, isActive: boolean) =>
  isActive || (item.alsoActiveFor ?? []).some((p) => route.path.startsWith(p));
</script>

<template>
  <v-navigation-drawer
    permanent
    width="220"
    class="sidebar"
    aria-label="Navigasi utama"
  >
    <div class="sidebar__head">
      <BrandLogo :height="27.491" />
      <p class="sidebar__app">Visit Tracker</p>
    </div>
    <nav class="sidebar__nav">
      <router-link
        v-for="item in items"
        :key="item.to"
        v-slot="{ href, navigate, isActive }"
        :to="item.to"
        custom
      >
        <a
          :href="href"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': active(item, isActive) }"
          :aria-current="active(item, isActive) ? 'page' : undefined"
          @click="navigate"
        >
          <v-icon :icon="item.icon" size="22" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge?.value" class="sidebar__badge">{{ item.badge.value }}</span>
        </a>
      </router-link>
    </nav>
    <div class="sidebar__bottom">
      <button type="button" class="sidebar__item" @click="$emit('logout')">
        <v-icon icon="mdi-logout" size="22" />
        <span>Keluar</span>
      </button>
    </div>
  </v-navigation-drawer>
</template>

<style scoped>
.sidebar :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
}
.sidebar__head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 16px;
}
.sidebar__head > :first-child {
  padding: 8px;
}
.sidebar__app {
  padding: 4px 8px;
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
}
.sidebar__nav {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  padding: 16px 16px 0;
  overflow-y: auto;
  scrollbar-width: none;
}
.sidebar__bottom {
  padding: 0 16px 16px;
}
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  text-align: left;
}
.sidebar__item .v-icon {
  color: rgb(var(--v-theme-text-secondary));
}
.sidebar__item:hover {
  background: rgb(var(--v-theme-canvas-alt));
}
.sidebar__item--active,
.sidebar__item--active:hover {
  background: rgb(var(--v-theme-brand-softer));
  color: rgb(var(--v-theme-secondary));
}
.sidebar__item--active .v-icon {
  color: rgb(var(--v-theme-secondary));
}
.sidebar__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: auto;
  padding: 0 6px;
  border-radius: 999px;
  background: rgb(var(--v-theme-warning-surface));
  color: rgb(var(--v-theme-warning));
  font-size: 11px;
  font-weight: 600;
}
</style>
