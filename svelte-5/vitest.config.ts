import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // Без умови browser Vitest бере серверну збірку Svelte, і mount() падає
  // з помилкою «not available on the server».
  resolve: { conditions: ['browser'] },
  // Тисяча рядків у jsdom на повільному ноутбуці перевищує 5 с за замовчуванням.
  test: { environment: 'jsdom', include: ['tests/**/*.spec.ts'], testTimeout: 30_000 },
});
