import { expect, test, type Page } from '@playwright/test';

// Ці властивості автоматичний аудит не перевіряє, бо бачить розмітку, а не поведінку.
const outline = (page: Page) => page.evaluate(() => {
  const element = document.activeElement as HTMLElement | null;
  return element ? getComputedStyle(element).outlineStyle : 'none';
});

test('поле у фокусі має видиму обвідку', async ({ page }) => {
  await page.goto('/new');
  await page.getByLabel('Назва').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Маса, кг')).toBeFocused();
  expect(await outline(page)).not.toBe('none');
});

test('Escape закриває діалог підтвердження і повертає фокус на кнопку', async ({ page }) => {
  await page.goto('/new');
  const opener = page.getByRole('button', { name: 'Очистити форму' });
  await opener.click();
  const dialog = page.getByRole('alertdialog', { name: 'Очистити форму?' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
