import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['tests/component/setup.ts'],
    // Випадки контракту першої роботи рахують рядки всієї таблиці, і на 2000
    // записах у jsdom один випадок триває кілька секунд, тому тайм-аут збільшено.
    testTimeout: 30_000,
  },
});
