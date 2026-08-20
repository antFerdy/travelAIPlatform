import { expect, test } from '@playwright/test'

/**
 * Главный пользовательский путь целиком, против прод-сборки.
 *
 * Бэкенд подменён браузерным MSW (см. .env.e2e и src/test/browserMocks.ts):
 * заглушка повторяет docs/superpowers/specs/api.md, поэтому сценарий проверяет
 * реальный HTTP-клиент, не требуя поднятого Go-сервера с базой.
 */
test('находит тур по фильтрам и оформляет бронь без оплаты', async ({ page }) => {
  await page.goto('/tours')

  await expect(page.getByRole('heading', { name: 'Туры', level: 1 })).toBeVisible()
  await expect(page.getByText(/^\d+ тур/)).toBeVisible()

  // Сужаем выдачу фильтром по стране
  await page.getByLabel('Страна').selectOption({ label: 'Турция' })

  await expect(page).toHaveURL(/countryId=/)
  await expect(page.getByText('Активных фильтров: 1')).toBeVisible()

  const cards = page.getByRole('article')
  await expect(cards.first()).toBeVisible()

  const cardCount = await cards.count()
  expect(cardCount).toBeGreaterThan(0)

  for (let index = 0; index < cardCount; index += 1) {
    await expect(cards.nth(index).getByText('Турция', { exact: true })).toBeVisible()
  }

  // Переходим на страницу тура
  const tourTitle = await cards.first().getByRole('heading').innerText()
  await cards.first().getByRole('heading').getByRole('link').click()

  await expect(page).toHaveURL(/\/tours\/\d+$/)
  await expect(page.getByRole('heading', { name: tourTitle, level: 1 })).toBeVisible()
  await expect(page.getByText('Начало')).toBeVisible()

  await page.getByRole('link', { name: 'Забронировать' }).click()

  await expect(page).toHaveURL(/\/tours\/\d+\/book$/)
  await expect(page.getByRole('heading', { name: 'Бронирование' })).toBeVisible()

  await page.getByLabel('Имя и фамилия').fill('Айгерим Сериковна')
  await page.getByLabel('Email').fill('aigerim@example.kz')
  await page.getByLabel('Телефон').fill('+7 701 000 00 00')
  await page.getByLabel('Сколько человек').selectOption('3')

  await page.getByRole('button', { name: 'Забронировать без оплаты' }).click()

  // Подтверждение
  await expect(page).toHaveURL(/\/bookings\/\d+$/)
  await expect(page.getByRole('heading', { name: 'Бронь принята' })).toBeVisible()
  await expect(page.getByText(/^№\d+$/)).toBeVisible()
  await expect(page.getByText('Ожидает подтверждения менеджера')).toBeVisible()
  await expect(page.getByText('3 человека', { exact: true })).toBeVisible()

  // Оплаты в сценарии нет ни на одном шаге
  await expect(page.getByText(/Оплата не требуется/)).toBeVisible()
})

test('не отправляет пустую форму брони', async ({ page }) => {
  await page.goto('/tours')

  await page.getByRole('article').first().getByRole('heading').getByRole('link').click()
  await page.getByRole('link', { name: 'Забронировать' }).click()

  await expect(page.getByRole('heading', { name: 'Бронирование' })).toBeVisible()

  await page.getByRole('button', { name: 'Забронировать без оплаты' }).click()

  await expect(page.getByText('Укажите имя и фамилию')).toBeVisible()
  await expect(page).toHaveURL(/\/book$/)
})
