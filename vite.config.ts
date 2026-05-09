/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      exclude: [
        'coverage/**',
        'dist/**',
        '**/*.test.{ts,tsx}',
        '**/__tests__/**',
        '**/*.d.ts',
        'src/main.tsx',
        // types.ts es puro tipos — v8 no encuentra ejecutable y reporta 0%.
        'src/engine/types.ts',
        // strategies/base.ts es puro interface — sin código a ejecutar.
        'src/strategies/base.ts',
        // App.tsx es placeholder UI; se cubrirá cuando llegue Phase 4.
        'src/App.tsx',
        'vite.config.ts',
        'eslint.config.js',
      ],
    },
  },
})
