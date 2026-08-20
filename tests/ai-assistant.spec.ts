import { test, expect } from '@playwright/test';

test.describe('AI assistant', () => {
  test('recommends tours based on budget and dates', async ({ page }) => {
    await page.goto('/');

    const chat = page.getByTestId('ai-chat');
    await expect(chat).toBeVisible();

    await page.getByTestId('ai-chat-input').fill(
      'Find me a tour to Turkey from September 1 to September 10 under $1000'
    );

    await page.getByTestId('ai-chat-send').click();

    const response = page.getByTestId('ai-chat-response').last();
    await expect(response).toBeVisible();
    await expect(response).not.toHaveText('');
  });
});
