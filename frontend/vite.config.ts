import { realpathSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Sumber token design system. Satu-satunya sumber warna.
      '@tokens': fileURLToPath(new URL('../docs/design-system/skolla-lms/tokens.json', import.meta.url)),
    },
  },
  server: {
    port: 3010,
    // realpath node_modules: jika berupa symlink (mis. git worktree), font di dalamnya tetap boleh dilayani
    fs: { allow: ['..', realpathSync(fileURLToPath(new URL('./node_modules', import.meta.url)))] },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
