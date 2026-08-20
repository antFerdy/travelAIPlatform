import { test, expect } from '@playwright/test';

test.describe('Booking flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tour-card').first().click();
    await page.getByTestId('book-tour-button').click();
  });

  test('completes booking successfully', async ({ page }) => {
    await page.getByTestId('booking-name').fill('Aliya Test');
    await page.getByTestId('booking-email').fill('aliya@example.com');
    await page.getByTestId('booking-phone').fill('+77000000000');

    await page.getByTestId('booking-submit').click();

    await expect(page.getByTestId('booking-success')).toBeVisible();
    await expect(page.getByTestId('booking-success')).toContainText(/success|confirmed|успеш/i);
  });

  test('validates required booking fields', async ({ page }) => {
    await page.getByTestId('booking-submit').click();

    await expect(page.getByTestId('booking-form')).toBeVisible();
    await expect(page.getByTestId('booking-error')).toBeVisible();
  });

  test('validates invalid email', async ({ page }) => {
    await page.getByTestId('booking-name').fill('Aliya Test');
    await page.getByTestId('booking-email').fill('wrong-email');
    await page.getByTestId('booking-phone').fill('+77000000000');

    await page.getByTestId('booking-submit').click();

    await expect(page.getByTestId('booking-email-error')).toBeVisible();
  });
});
