import { test, expect } from '@playwright/test';

test.describe('Tour filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('filters tours by country', async ({ page }) => {
    await page.getByTestId('country-filter').selectOption({ label: 'Turkey' });

    const cards = page.getByTestId('tour-card');
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i)).toContainText(/Turkey/i);
    }
  });

  test('filters tours by maximum price', async ({ page }) => {
    const maxPrice = 1000;

    await page.getByTestId('max-price-filter').fill(String(maxPrice));
    await page.getByTestId('apply-filters').click();

    const cards = page.getByTestId('tour-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).getByTestId('tour-price').innerText();
      const price = Number(text.replace(/[^\d.]/g, ''));
      expect(price).toBeLessThanOrEqual(maxPrice);
    }
  });

  test('filters tours by dates', async ({ page }) => {
    await page.getByTestId('date-from-filter').fill('2026-09-01');
    await page.getByTestId('date-to-filter').fill('2026-09-15');
    await page.getByTestId('apply-filters').click();

    await expect(page.getByTestId('tour-results')).toBeVisible();
  });

  test('shows empty state when nothing matches filters', async ({ page }) => {
    await page.getByTestId('max-price-filter').fill('1');
    await page.getByTestId('apply-filters').click();

    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});
