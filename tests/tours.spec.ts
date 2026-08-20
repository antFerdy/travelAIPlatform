import { test, expect } from '@playwright/test';

test.describe('Tours catalogue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays available tours', async ({ page }) => {
    const cards = page.getByTestId('tour-card');

    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(await cards.count());
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('opens tour details page', async ({ page }) => {
    const firstCard = page.getByTestId('tour-card').first();
    await expect(firstCard).toBeVisible();

    await firstCard.click();

    await expect(page.getByTestId('tour-details')).toBeVisible();
    await expect(page.getByTestId('book-tour-button')).toBeVisible();
  });
});
