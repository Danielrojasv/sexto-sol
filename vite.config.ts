/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { gameLogsPlugin } from './scripts/vite-plugin-game-logs'

export default defineConfig({
  plugins: [react(), tailwindcss(), gameLogsPlugin()],
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
        // actions.ts es discriminated union — sin código ejecutable.
        'src/engine/actions.ts',
        // App.tsx es placeholder UI; UI completa llega en Phase 3.
        'src/App.tsx',
        // scripts/ es tooling CLI (validate-cards, migrate scripts) — no
        // runtime de la app. Excluido del coverage threshold del engine.
        'scripts/**',
        // docs/archive/ es código v3.0 archivado, no parte del bundle.
        'docs/archive/**',
        // UI/store: smoke tests cubren componentes principales; tests E2E
        // profundos quedan para futura iteración. Excluidos del threshold
        // engine global para no falsear el número de coverage del engine.
        'src/ui/**',
        'src/store/**',
        'vite.config.ts',
        'eslint.config.js',
      ],
    },
  },
})
