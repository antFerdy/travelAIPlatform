import { test, expect } from '@playwright/test';

test.describe('Resilience', () => {
  test('website remains usable when AI API is unavailable', async ({ page }) => {
    await page.route('**/api/ai/**', async route => {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service unavailable' })
      });
    });

    await page.goto('/');

    await expect(page.getByTestId('tour-card').first()).toBeVisible();

    await page.getByTestId('tour-card').first().click();
    await expect(page.getByTestId('tour-details')).toBeVisible();

    await page.getByTestId('book-tour-button').click();
    await expect(page.getByTestId('booking-form')).toBeVisible();
  });

  test('shows safe error state when backend returns an error', async ({ page }) => {
    await page.route('**/api/tours**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/');

    await expect(page.getByTestId('api-error-state')).toBeVisible();
  });
});
