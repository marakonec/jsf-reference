import { expect, test } from '@playwright/test';

// Опис постачальника є лише в еталоні: поле з даних виводиться текстом, і тест
// перевіряє, що вставлена в нього розмітка не виконується.
test('розмітка з опису постачальника показується текстом і не виконується', async ({ page }) => {
  await page.goto('/record/7');
  await expect(page.locator('#description')).toContainText('<img');
  await expect(page.locator('#injected-by-description')).toHaveCount(0);
});
