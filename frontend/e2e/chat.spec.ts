import { expect, test } from '@playwright/test'

/**
 * Чат — плавающий слой поверх страницы. В настоящем браузере проверяется то,
 * чего не воспроизводит jsdom: на узком экране окно занимает весь вьюпорт, а
 * кнопка-иконка на это время скрывается, поэтому возврат фокуса после закрытия
 * ломается именно там.
 */
const LAUNCHER = 'Открыть чат с ИИ-помощником'

test('открывает и закрывает чат, возвращая фокус на кнопку', async ({ page }) => {
  await page.goto('/tours')

  const launcher = page.getByRole('button', { name: LAUNCHER })
  const dialog = page.getByRole('dialog', { name: 'Чат с ИИ-помощником' })

  await launcher.click()
  await expect(dialog).toBeVisible()

  await page.keyboard.press('Escape')

  await expect(dialog).toBeHidden()
  await expect(launcher).toBeFocused()
})

test('отвечает на отправленное сообщение', async ({ page }) => {
  await page.goto('/tours')

  await page.getByRole('button', { name: LAUNCHER }).click()
  await page.getByRole('textbox', { name: 'Сообщение' }).fill('Есть что-то подешевле?')
  await page.getByRole('textbox', { name: 'Сообщение' }).press('Enter')

  const messages = page.locator('[role="dialog"] li')

  // Ответ помощника цитирует вопрос, поэтому пузырь пользователя ищем точным совпадением.
  await expect(messages.filter({ hasText: /^Есть что-то подешевле\?$/ })).toBeVisible()
  await expect(messages.last()).toContainText('Подобрал варианты по запросу')
  await expect(page.getByRole('textbox', { name: 'Сообщение' })).toHaveValue('')
})
