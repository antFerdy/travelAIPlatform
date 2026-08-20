import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { API_BASE_URL, mswServer, resetServerState } from '@/test/mswServer'
import { makeBookingDraft } from '@/test/factories'
import { MAX_GUESTS } from '@/types/booking'

import { httpApi } from '../adapters/http'
import { mockApi } from '../adapters/mock'
import { ApiError, type Api } from '../contract'

/**
 * Один набор проверок на оба адаптера.
 *
 * Это единственная гарантия того, что переключение VITE_API_MODE=http
 * не изменит поведение экранов, отлаженных на моках. Расхождение между
 * реализациями обязано валить сборку, а не всплывать в проде.
 */
const adapters: readonly [string, Api][] = [
  ['mock', mockApi],
  ['http', httpApi],
]

beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', API_BASE_URL)
  mswServer.listen({ onUnhandledRequest: 'error' })
})

afterEach(() => {
  mswServer.resetHandlers()
  resetServerState()
})

afterAll(() => {
  mswServer.close()
  vi.unstubAllEnvs()
})

describe.each(adapters)('Api контракт: адаптер %s', (_name, api) => {
  beforeEach(() => {
    localStorage.clear()
    resetServerState()
  })

  describe('listTours', () => {
    it('возвращает страницу каталога с полными метаданными', async () => {
      const page = await api.listTours({ limit: 5 })

      expect(page.items.length).toBeLessThanOrEqual(5)
      expect(page.limit).toBe(5)
      expect(page.page).toBe(1)
      expect(page.total).toBeGreaterThan(page.items.length)
    })

    it('фильтрует по стране', async () => {
      const page = await api.listTours({ country: 'Грузия' })

      expect(page.items.length).toBeGreaterThan(0)
      expect(page.items.every((tour) => tour.country === 'Грузия')).toBe(true)
    })

    it('фильтрует по диапазону цены', async () => {
      const page = await api.listTours({ priceMin: 300_000, priceMax: 600_000, limit: 50 })

      expect(page.items.length).toBeGreaterThan(0)
      expect(
        page.items.every(
          (tour) => tour.pricePerPerson >= 300_000 && tour.pricePerPerson <= 600_000,
        ),
      ).toBe(true)
    })

    it('сортирует по возрастанию цены', async () => {
      const { items } = await api.listTours({ sort: 'price-asc', limit: 50 })
      const prices = items.map((tour) => tour.pricePerPerson)

      expect(prices).toEqual([...prices].sort((a, b) => a - b))
    })

    it('отдаёт непересекающиеся страницы', async () => {
      const first = await api.listTours({ limit: 4, page: 1, sort: 'price-asc' })
      const second = await api.listTours({ limit: 4, page: 2, sort: 'price-asc' })

      const overlap = first.items.filter((tour) =>
        second.items.some((other) => other.id === tour.id),
      )

      expect(overlap).toEqual([])
    })

    it('возвращает пустую страницу, а не ошибку, когда ничего не подошло', async () => {
      const page = await api.listTours({ country: 'Антарктида' })

      expect(page.items).toEqual([])
      expect(page.total).toBe(0)
    })
  })

  describe('getTour', () => {
    it('возвращает тур по идентификатору', async () => {
      const { items } = await api.listTours({ limit: 1 })
      const expected = items[0]

      if (!expected) throw new Error('Каталог пуст — фикстура сломана')

      const tour = await api.getTour(expected.id)

      expect(tour.id).toBe(expected.id)
      expect(tour.currency).toBe('KZT')
    })

    it('падает с ApiError 404 на несуществующем туре', async () => {
      await expect(api.getTour('нет-такого-тура')).rejects.toMatchObject({
        name: 'ApiError',
        status: 404,
      })
    })
  })

  describe('listCountries', () => {
    it('возвращает страны каталога по алфавиту без повторов', async () => {
      const countries = await api.listCountries()

      expect(countries.length).toBeGreaterThan(1)
      expect(new Set(countries).size).toBe(countries.length)
      expect(countries).toEqual([...countries].sort((a, b) => a.localeCompare(b, 'ru')))
    })
  })

  describe('createBooking', () => {
    it('создаёт бронь и считает сумму по цене тура', async () => {
      const { items } = await api.listTours({ limit: 50 })
      const tour = items.find((candidate) => (candidate.departures[0]?.seatsLeft ?? 0) >= 2)
      const departure = tour?.departures[0]

      if (!tour || !departure) throw new Error('Нет тура со свободными местами')

      const booking = await api.createBooking(
        makeBookingDraft({ tourId: tour.id, departureId: departure.id, guests: 2 }),
      )

      expect(booking.id).toMatch(/^BK-/)
      expect(booking.status).toBe('pending')
      expect(booking.currency).toBe('KZT')
      expect(booking.total).toBe(tour.pricePerPerson * 2)
    })

    it('падает с 404, если тура не существует', async () => {
      await expect(
        api.createBooking(makeBookingDraft({ tourId: 'нет-такого-тура' })),
      ).rejects.toMatchObject({ name: 'ApiError', status: 404 })
    })

    it('падает с 400, если вылет не принадлежит туру', async () => {
      const { items } = await api.listTours({ limit: 1 })
      const tour = items[0]

      if (!tour) throw new Error('Каталог пуст — фикстура сломана')

      await expect(
        api.createBooking(makeBookingDraft({ tourId: tour.id, departureId: 'dep-999' })),
      ).rejects.toMatchObject({ name: 'ApiError', status: 400 })
    })

    it('списывает занятые места, а не только сохраняет бронь', async () => {
      const { items } = await api.listTours({ limit: 50 })
      const tour = items.find((candidate) => (candidate.departures[0]?.seatsLeft ?? 0) >= 3)
      const departure = tour?.departures[0]

      if (!tour || !departure) throw new Error('Нет тура со свободными местами')

      const before = departure.seatsLeft

      await api.createBooking(
        makeBookingDraft({ tourId: tour.id, departureId: departure.id, guests: 2 }),
      )

      const refreshed = await api.getTour(tour.id)
      const updated = refreshed.departures.find((candidate) => candidate.id === departure.id)

      expect(updated?.seatsLeft).toBe(before - 2)
    })

    it('не даёт забронировать больше мест, чем осталось после предыдущих броней', async () => {
      const { items } = await api.listTours({ limit: 50 })

      const candidate = items
        .flatMap((tour) => tour.departures.map((departure) => ({ tour, departure })))
        .find(({ departure }) => departure.seatsLeft >= 2 && departure.seatsLeft <= 4)

      if (!candidate) throw new Error('Нет вылета с небольшим числом мест')

      const { tour, departure } = candidate

      // Выкупаем все места
      await api.createBooking(
        makeBookingDraft({
          tourId: tour.id,
          departureId: departure.id,
          guests: departure.seatsLeft,
        }),
      )

      await expect(
        api.createBooking(
          makeBookingDraft({ tourId: tour.id, departureId: departure.id, guests: 1 }),
        ),
      ).rejects.toMatchObject({ name: 'ApiError', status: 400 })
    })

    it('падает с 400, если мест на вылете меньше, чем гостей', async () => {
      const { items } = await api.listTours({ limit: 50 })

      const candidate = items
        .flatMap((tour) => tour.departures.map((departure) => ({ tour, departure })))
        .find(({ departure }) => departure.seatsLeft < MAX_GUESTS)

      if (!candidate) throw new Error('Нет вылета с ограниченным числом мест')

      await expect(
        api.createBooking(
          makeBookingDraft({
            tourId: candidate.tour.id,
            departureId: candidate.departure.id,
            guests: MAX_GUESTS,
          }),
        ),
      ).rejects.toMatchObject({ name: 'ApiError', status: 400 })
    })
  })

  describe('getBooking', () => {
    it('возвращает ранее созданную бронь целиком', async () => {
      const { items } = await api.listTours({ limit: 50 })
      const tour = items.find((candidate) => (candidate.departures[0]?.seatsLeft ?? 0) >= 1)
      const departure = tour?.departures[0]

      if (!tour || !departure) throw new Error('Нет тура со свободными местами')

      const created = await api.createBooking(
        makeBookingDraft({ tourId: tour.id, departureId: departure.id, guests: 1 }),
      )

      const fetched = await api.getBooking(created.id)

      expect(fetched).toEqual(created)
    })

    it('падает с ApiError 404 на неизвестном номере брони', async () => {
      await expect(api.getBooking('BK-000000')).rejects.toBeInstanceOf(ApiError)
      await expect(api.getBooking('BK-000000')).rejects.toMatchObject({ status: 404 })
    })
  })
})
