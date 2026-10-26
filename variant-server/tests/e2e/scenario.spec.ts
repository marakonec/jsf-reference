import { expect, test } from '@playwright/test';

test('відфільтрувати каталог, відкрити картку, позначити запис', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Фільтр' }).fill('шків');
  const link = page.getByRole('rowgroup', { name: 'Записи' }).getByRole('link').first();
  const name = (await link.textContent()) ?? '';
  expect(name).toContain('шків');

  await link.click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  const marked = page.locator('dt', { hasText: 'Позначений' }).locator('xpath=following-sibling::dd[1]');
  const before = await marked.textContent();

  await page.getByRole('button', { name: 'Перемкнути позначку' }).click();
  await expect(marked).not.toHaveText(before ?? '');
});
