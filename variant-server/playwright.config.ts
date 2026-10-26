import { createRequire } from 'node:module';
import { defineConfig, devices } from '@playwright/test';

// Тести йдуть проти зібраного застосунку в режимі випуску, як радить
// документація Next.js («How to set up Playwright»). Порт 3113, а не 3102,
// щоб тести не підхопили сервер з іншим складанням.
const require = createRequire(import.meta.url);
const NEXT = require.resolve('next/dist/bin/next');
const PORT = 3113;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // Аудит доступності маршруту колекції з тисячами рядків триває довше за
  // тайм-аут тесту за замовчуванням 30 с (документація Playwright, «Timeouts»).
  timeout: 120_000,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off' },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // PW_CHANNEL=chrome запускає встановлений Google Chrome замість Chromium,
        // завантаженого командою npx playwright install (документація Playwright, «Browsers»).
        ...(process.env['PW_CHANNEL'] ? { channel: process.env['PW_CHANNEL'] } : {}),
      },
    },
  ],
  webServer: {
    command: `node "${NEXT}" start -p ${PORT}`,
    // Готовність перевіряється на маршруті колекції, який є в кожній предметній області.
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_TELEMETRY_DISABLED: '1', SOURCE_DELAY_MS: '0' },
  },
});
