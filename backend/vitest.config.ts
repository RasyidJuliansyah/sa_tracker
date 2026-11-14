import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/db/**/*.test.ts'],
    environment: 'node',
    // Tes database berbagi satu database uji: jalankan berkas satu per satu agar hasilnya tidak acak.
    fileParallelism: false,
    env: { BCRYPT_COST: '4' },
  },
})
