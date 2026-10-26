import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Прийом з документації Playwright «Accessibility testing». Теги охоплюють
// рівні A і AA WCAG 2.0, 2.1 і 2.2.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const audit = (page: Page) => new AxeBuilder({ page }).withTags(TAGS).analyze();
const ruleIds = (result: Awaited<ReturnType<typeof audit>>) => result.violations.map((v) => v.id).sort();

for (const route of ['/', '/new', '/record/5']) {
  test(`${route}: порушень немає`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(ruleIds(await audit(page))).toEqual([]);
  });
}

test('форма з відкритим діалогом підтвердження: порушень немає', async ({ page }) => {
  await page.goto('/new');
  await page.getByRole('button', { name: 'Очистити форму' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Очистити форму?' })).toBeVisible();
  expect(ruleIds(await audit(page))).toEqual([]);
});
