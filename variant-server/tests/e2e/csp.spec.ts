import { expect, test } from '@playwright/test';

for (const route of ['/', '/new', '/record/7']) {
  test(`${route}: заголовок політики є, порушень у консолі немає`, async ({ page }) => {
    const violations: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /Content Security Policy/.test(message.text())) violations.push(message.text());
    });
    const response = await page.goto(route);
    // Сторінка 404 теж має заголовок політики, тому спершу перевіряється, що маршрут існує.
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'");
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(violations).toEqual([]);
  });
}

test('під політикою фільтр каталогу працює, клієнтські сценарії виконуються', async ({ page }) => {
  await page.goto('/');
  const rows = page.getByRole('rowgroup', { name: 'Записи' }).getByRole('row');
  // Рядки каталогу надходять потоком після оболонки сторінки.
  await expect(rows.first()).toBeVisible();
  const total = await rows.count();
  await page.getByRole('textbox', { name: 'Фільтр' }).fill('шків');
  await expect.poll(() => rows.count()).toBeLessThan(total);
});
