import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Тисяча рядків у jsdom на повільному ноутбуці перевищує 5 с за замовчуванням.
  test: { environment: 'jsdom', include: ['tests/**/*.spec.tsx'], testTimeout: 30_000 },
});
