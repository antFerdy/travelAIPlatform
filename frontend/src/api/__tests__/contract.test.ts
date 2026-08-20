import { describe, expect, it } from 'vitest'

import { COUNTRIES, TOURS, makeBookingDraft } from '@/test/fixtures'

import { ApiError } from '../contract'
import { api } from '../index'

/**
 * Проверка того, что клиент говорит с бэкендом на языке из
 * docs/superpowers/specs/api.md: snake_case на проводе, camelCase внутри,
 * коды 404 и 422, пересечение диапазонов дат.
 *
 * Запросы обслуживает заглушка в src/test/handlers.ts, повторяющая
 * спецификацию. Если бэкенд от неё отступит — расхождение всплывёт здесь.
 */
describe('listTours', () => {
  it('возвращает страницу каталога с метаданными пагинации', async () => {
    const page = await api.listTours({ limit: 5 })

    expect(page.items).toHaveLength(5)
    expect(page.page).toBe(1)
    expect(page.limit).toBe(5)
    expect(page.total).toBe(TOURS.length)
  })

  it('переводит ответ из snake_case в доменный тип', async () => {
    const { items } = await api.listTours({ limit: 1 })
    const tour = items[0]

    if (!tour) throw new Error('Каталог пуст — фикстура сломана')

    expect(tour).toMatchObject({
      id: expect.any(Number),
      countryId: expect.any(Number),
      durationDays: expect.any(Number),
      startDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      endDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      createdAt: expect.any(String),
    })

    expect(tour).not.toHaveProperty('country_id')
    expect(tour).not.toHaveProperty('duration_days')
  })

  it('фильтрует по стране', async () => {
    const page = await api.listTours({ countryId: 1, limit: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((tour) => tour.countryId === 1)).toBe(true)
    expect(page.total).toBeLessThan(TOURS.length)
  })

  it('фильтрует по диапазону цены включительно', async () => {
    const page = await api.listTours({ minPrice: 700_000, maxPrice: 800_000, limit: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((tour) => tour.price >= 700_000 && tour.price <= 800_000)).toBe(true)
  })

  it('отбирает туры, пересекающиеся с окном дат, а не только вложенные в него', async () => {
    const window = { dateFrom: '2026-09-10', dateTo: '2026-09-14' }
    const page = await api.listTours({ ...window, limit: 100 })

    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.every((tour) => tour.endDate >= window.dateFrom)).toBe(true)
    expect(page.items.every((tour) => tour.startDate <= window.dateTo)).toBe(true)

    // Тур, начавшийся до окна и закончившийся внутри него, обязан попасть в выдачу
    expect(page.items.some((tour) => tour.startDate < window.dateFrom)).toBe(true)
  })

  it('отдаёт непересекающиеся страницы', async () => {
    const first = await api.listTours({ limit: 4, page: 1 })
    const second = await api.listTours({ limit: 4, page: 2 })

    const overlap = first.items.filter((tour) => second.items.some((other) => other.id === tour.id))

    expect(overlap).toEqual([])
  })

  it('возвращает пустую страницу, а не ошибку, когда ничего не подошло', async () => {
    const page = await api.listTours({ minPrice: 99_000_000 })

    expect(page.items).toEqual([])
    expect(page.total).toBe(0)
  })

  it('падает с 422 на некорректном параметре', async () => {
    await expect(api.listTours({ page: 0 })).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
    })
  })
})

describe('getTour', () => {
  it('возвращает тур по числовому идентификатору', async () => {
    const tour = await api.getTour(1)

    expect(tour.id).toBe(1)
    expect(tour.currency).toBe('KZT')
  })

  it('падает с ApiError 404 на несуществующем туре', async () => {
    await expect(api.getTour(9999)).rejects.toBeInstanceOf(ApiError)
    await expect(api.getTour(9999)).rejects.toMatchObject({ status: 404 })
  })
})

describe('listCountries', () => {
  it('возвращает справочник стран', async () => {
    const countries = await api.listCountries()

    expect(countries).toEqual(COUNTRIES)
  })
})

describe('createBooking', () => {
  it('создаёт бронь со статусом pending', async () => {
    const booking = await api.createBooking(makeBookingDraft({ tourId: 1, numPeople: 3 }))

    expect(booking.id).toBeGreaterThan(0)
    expect(booking.tourId).toBe(1)
    expect(booking.numPeople).toBe(3)
    expect(booking.status).toBe('pending')
  })

  it('отправляет тело в snake_case, как ждёт бэкенд', async () => {
    // Заглушка проверяет именно snake_case-ключи: пройдёт только правильное тело
    const booking = await api.createBooking(
      makeBookingDraft({ customerName: 'Пётр Иванов', customerEmail: 'p@example.kz' }),
    )

    expect(booking.customerName).toBe('Пётр Иванов')
    expect(booking.customerEmail).toBe('p@example.kz')
  })

  it('падает с 404, если тура не существует', async () => {
    await expect(api.createBooking(makeBookingDraft({ tourId: 9999 }))).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    })
  })

  it('падает с 422 на некорректном email', async () => {
    await expect(
      api.createBooking(makeBookingDraft({ customerEmail: 'не-адрес' })),
    ).rejects.toMatchObject({ name: 'ApiError', status: 422 })
  })

  it('падает с 422, когда число человек не больше нуля', async () => {
    await expect(api.createBooking(makeBookingDraft({ numPeople: 0 }))).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
    })
  })
})

describe('getBooking', () => {
  it('возвращает ранее созданную бронь целиком', async () => {
    const created = await api.createBooking(makeBookingDraft())
    const fetched = await api.getBooking(created.id)

    expect(fetched).toEqual(created)
  })

  it('падает с ApiError 404 на неизвестном номере', async () => {
    await expect(api.getBooking(4242)).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
    })
  })
})

describe('ApiError', () => {
  it('прячет технический текст за понятным сообщением', () => {
    expect(new ApiError(0, 'fetch failed').userMessage).toMatch(/Сервер недоступен/)
    expect(new ApiError(500, 'boom').userMessage).toMatch(/ошибку/)
    expect(new ApiError(422, 'validation failed: email').userMessage).toBe(
      'validation failed: email',
    )
  })
})
