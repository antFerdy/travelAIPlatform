/**
 * Снимает скриншоты для README против уже запущенного preview-сервера.
 *
 *   npm run preview            # в одном терминале
 *   node scripts/screenshots.mjs
 *
 * Отдельный скрипт, а не тест: это генерация артефакта документации,
 * ей нечего делать в наборе проверок.
 */
import { mkdir } from 'node:fs/promises'

import { chromium, devices } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173'
// Скриншоты лежат в общей папке репозитория: на них ссылается корневой README.
const OUT_DIR = '../docs/screenshots'

await mkdir(OUT_DIR, { recursive: true })

/**
 * Ждём картинки, попавшие в кадр. Остальные помечены loading="lazy"
 * и на узком экране не загрузятся никогда — ожидание всех висло бы.
 */
async function settle(page) {
  await page.waitForLoadState('networkidle')
  await page.waitForFunction(
    () =>
      [...document.images]
        .filter((image) => image.getBoundingClientRect().top < window.innerHeight)
        .every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 15_000 },
  )
}

async function capture(context, suffix) {
  const page = await context.newPage()
  const shot = async (name) => {
    await settle(page)
    await page.screenshot({ path: `${OUT_DIR}/${name}${suffix}.png` })
    console.log(`сняли ${name}${suffix}`)
  }

  // Каталог
  await page.goto(`${BASE_URL}/tours`)
  await page.getByRole('article').first().waitFor()
  await shot('catalog')

  // Каталог с применённым фильтром
  await page.goto(`${BASE_URL}/tours?country=Турция&sort=price-asc`)
  await page.getByText('Активных фильтров: 1').waitFor()
  await page.getByRole('article').first().waitFor()
  await shot('filters')

  // Страница тура. Ждём смены адреса, иначе снимок ловит скелетон загрузки.
  await page.getByRole('article').first().getByRole('heading').getByRole('link').click()
  await page.waitForURL(/\/tours\/[\w-]+$/)
  await page.getByRole('button', { name: /осталось \d+ мест/ }).first().waitFor()
  await shot('tour')

  // Форма брони с групповой скидкой
  await page.getByRole('button', { name: 'Забронировать', exact: true }).click()
  await page.waitForURL(/\/book/)
  await page.getByRole('heading', { name: 'Бронирование' }).waitFor()
  await page.getByLabel('Гостей').selectOption('3')
  await page.getByText(/Скидка за группу/).waitFor()
  await shot('booking')

  await page.close()
}

const browser = await chromium.launch()

const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } })
await capture(desktop, '')
await desktop.close()

const mobile = await browser.newContext({ ...devices['Pixel 7'] })
await capture(mobile, '-mobile')
await mobile.close()

await browser.close()
console.log('готово')
