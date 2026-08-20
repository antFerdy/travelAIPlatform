import { expect, test } from '@playwright/test'

/**
 * Фильтры хранятся в строке запроса. Это проверяется именно в браузере:
 * перезагрузка и кнопка «назад» — то, что юнит-тест не воспроизводит.
 */
test('открывает отфильтрованную выдачу по прямой ссылке', async ({ page }) => {
  await page.goto('/tours?countryId=1')

  await expect(page.getByLabel('Страна')).toHaveValue('1')
  await expect(page.getByText('Активных фильтров: 1')).toBeVisible()

  const cards = page.getByRole('article')
  await expect(cards.first()).toBeVisible()

  for (let index = 0; index < (await cards.count()); index += 1) {
    await expect(cards.nth(index).getByText('ОАЭ', { exact: true })).toBeVisible()
  }
})

test('переживает перезагрузку страницы', async ({ page }) => {
  await page.goto('/tours')

  await page.getByLabel('Страна').selectOption({ label: 'Турция' })
  await expect(page.getByText('Активных фильтров: 1')).toBeVisible()

  await page.reload()

  await expect(page.getByLabel('Страна')).toHaveValue('2')
  await expect(page.getByRole('article').first().getByText('Турция', { exact: true })).toBeVisible()
})

test('применяет цену по Enter и отражает её в адресе', async ({ page }) => {
  await page.goto('/tours')

  await page.getByLabel('Цена от, ₸').fill('800000')
  await page.getByLabel('Цена от, ₸').press('Enter')

  await expect(page).toHaveURL(/minPrice=800000/)
  await expect(page.getByText('Активных фильтров: 1')).toBeVisible()
})

test('сбрасывает все фильтры одной кнопкой', async ({ page }) => {
  await page.goto('/tours?countryId=2&minPrice=700000')

  await expect(page.getByText('Активных фильтров: 2')).toBeVisible()

  await page.getByRole('button', { name: 'Сбросить всё' }).click()

  await expect(page).toHaveURL(/\/tours$/)
  await expect(page.getByText(/Активных фильтров/)).toBeHidden()
  await expect(page.getByLabel('Страна')).toHaveValue('')
  await expect(page.getByLabel('Цена от, ₸')).toHaveValue('')
})

test('честно сообщает, когда под условия ничего не подошло', async ({ page }) => {
  await page.goto('/tours?minPrice=99000000')

  await expect(page.getByText('Под эти условия туров нет')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сбросить фильтры' })).toBeVisible()
})
