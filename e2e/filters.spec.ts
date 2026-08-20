import { expect, test } from '@playwright/test'

/**
 * Фильтры хранятся в строке запроса. Это проверяется именно в браузере:
 * перезагрузка и кнопка «назад» — то, что юнит-тест не воспроизводит.
 */
test('открывает отфильтрованную выдачу по прямой ссылке', async ({ page }) => {
  await page.goto('/tours?country=%D0%93%D1%80%D1%83%D0%B7%D0%B8%D1%8F&sort=price-asc')

  await expect(page.getByLabel('Страна')).toHaveValue('Грузия')
  await expect(page.getByLabel('Сортировка')).toHaveValue('price-asc')
  await expect(page.getByText('Активных фильтров: 1')).toBeVisible()

  const cards = page.getByRole('article')
  await expect(cards.first()).toBeVisible()

  for (let index = 0; index < (await cards.count()); index += 1) {
    await expect(cards.nth(index).getByText(/^Грузия,/)).toBeVisible()
  }
})

test('переживает перезагрузку страницы', async ({ page }) => {
  await page.goto('/tours')

  await page.getByLabel('Страна').selectOption('Египет')
  await expect(page.getByText('Активных фильтров: 1')).toBeVisible()

  await page.reload()

  await expect(page.getByLabel('Страна')).toHaveValue('Египет')
  await expect(page.getByRole('article').first().getByText(/^Египет,/)).toBeVisible()
})

test('сортировка по цене действительно упорядочивает выдачу', async ({ page }) => {
  await page.goto('/tours?sort=price-asc')

  await expect(page.getByRole('article').first()).toBeVisible()

  const raw = await page.getByText(/за одного гостя/).all()
  expect(raw.length).toBeGreaterThan(1)

  const prices = await page
    .locator('article p:has-text("₸")')
    .allInnerTexts()
    .then((texts) => texts.map((text) => Number(text.replace(/\D/g, ''))))

  expect(prices).toEqual([...prices].sort((a, b) => a - b))
})

test('сбрасывает все фильтры одной кнопкой', async ({ page }) => {
  await page.goto('/tours?country=%D0%A2%D1%83%D1%80%D1%86%D0%B8%D1%8F&guests=4')

  await expect(page.getByText('Активных фильтров: 2')).toBeVisible()

  await page.getByRole('button', { name: 'Сбросить всё' }).click()

  await expect(page).toHaveURL(/\/tours$/)
  await expect(page.getByText(/Активных фильтров/)).toBeHidden()
  await expect(page.getByLabel('Страна')).toHaveValue('')
})

test('честно сообщает, когда под условия ничего не подошло', async ({ page }) => {
  await page.goto('/tours?priceMin=99000000')

  await expect(page.getByText('Под эти условия туров нет')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сбросить фильтры' })).toBeVisible()
})
