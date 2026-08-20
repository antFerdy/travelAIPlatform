import { expect, test } from '@playwright/test'

/**
 * Главный пользовательский путь целиком, против прод-сборки в mock-режиме.
 * Backend для этого сценария не нужен — сайт обязан работать без него.
 */
test('находит тур по фильтрам и оформляет бронь без оплаты', async ({ page }) => {
  await page.goto('/tours')

  await expect(page.getByRole('heading', { name: 'Туры', level: 1 })).toBeVisible()

  const totalBefore = page.getByText(/^\d+ тур/)
  await expect(totalBefore).toBeVisible()

  // Сужаем выдачу фильтром по стране
  await page.getByLabel('Страна').selectOption('Грузия')

  await expect(page).toHaveURL(/country=/)
  await expect(page.getByText('Активных фильтров: 1')).toBeVisible()

  const cards = page.getByRole('article')
  await expect(cards.first()).toBeVisible()

  const cardCount = await cards.count()
  expect(cardCount).toBeGreaterThan(0)

  for (let index = 0; index < cardCount; index += 1) {
    await expect(cards.nth(index).getByText(/^Грузия,/)).toBeVisible()
  }

  // Переходим на страницу тура
  const tourTitle = await cards.first().getByRole('heading').innerText()
  await cards.first().getByRole('heading').getByRole('link').click()

  await expect(page).toHaveURL(/\/tours\/[\w-]+$/)
  await expect(page.getByRole('heading', { name: tourTitle, level: 1 })).toBeVisible()

  // Выбираем вылет со свободными местами
  const departure = page.getByRole('button', { name: /осталось \d+ мест/ }).first()
  await departure.click()
  await expect(departure).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: 'Забронировать', exact: true }).click()

  // Выбранный вылет должен доехать до формы через строку запроса
  await expect(page).toHaveURL(/\/book\?departureId=dep-\d+/)
  await expect(page.getByRole('heading', { name: 'Бронирование' })).toBeVisible()
  await expect(page.getByLabel('Дата вылета')).not.toHaveValue('')

  await page.getByLabel('Имя и фамилия').fill('Айгерим Сериковна')
  await page.getByLabel('Email').fill('aigerim@example.kz')
  await page.getByLabel('Телефон').fill('+7 701 000 00 00')
  await page.getByLabel('Гостей').selectOption('3')

  // От трёх гостей включается групповая скидка
  await expect(page.getByText(/Скидка за группу/)).toBeVisible()

  const total = await page.getByLabel('Итого к оплате').innerText()

  await page.getByRole('button', { name: 'Забронировать без оплаты' }).click()

  // Подтверждение
  await expect(page).toHaveURL(/\/bookings\/BK-/)
  await expect(page.getByRole('heading', { name: 'Бронь принята' })).toBeVisible()
  await expect(page.getByText(/^BK-[0-9A-F]{6}$/)).toBeVisible()
  await expect(page.getByText('Ожидает подтверждения менеджера')).toBeVisible()
  await expect(page.getByText('3 гостя')).toBeVisible()
  await expect(page.getByText(total, { exact: true })).toBeVisible()

  // Оплаты в сценарии нет ни на одном шаге
  await expect(page.getByText(/Оплата не требуется/)).toBeVisible()
})

test('не отправляет пустую форму брони', async ({ page }) => {
  await page.goto('/tours')

  await page.getByRole('article').first().getByRole('heading').getByRole('link').click()
  await page.getByRole('button', { name: 'Забронировать', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Бронирование' })).toBeVisible()

  await page.getByRole('button', { name: 'Забронировать без оплаты' }).click()

  await expect(page.getByText('Укажите имя и фамилию')).toBeVisible()
  await expect(page.getByText('Выберите дату вылета')).toBeVisible()
  await expect(page).toHaveURL(/\/book$/)
})
