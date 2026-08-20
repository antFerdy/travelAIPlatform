import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

import { collectCountries, filterTours } from '@/api/filterTours'
import { bookingDraftSchema, toursSchema } from '@/api/schemas'
import type { SortOption, TourQuery } from '@/api/contract'
import { SORT_OPTIONS } from '@/api/contract'
import { calculateTotal } from '@/domain/pricing'
import rawTours from '@/mocks/tours.json'
import type { Booking } from '@/types/booking'

export const API_BASE_URL = 'http://api.test'

const tours = toursSchema.parse(rawTours)

/**
 * Хранилище броней «сервера». Отдельно от localStorage мок-адаптера —
 * так контрактный тест видит два по-настоящему независимых бэкенда.
 */
const bookings = new Map<string, Booking>()

export function resetServerState(): void {
  bookings.clear()
}

function toNumber(value: string | null): number | undefined {
  if (value === null || value === '') return undefined

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : undefined
}

function toSort(value: string | null): SortOption | undefined {
  return SORT_OPTIONS.find((option) => option === value)
}

function parseQuery(url: URL): TourQuery {
  return {
    country: url.searchParams.get('country') ?? undefined,
    priceMin: toNumber(url.searchParams.get('priceMin')),
    priceMax: toNumber(url.searchParams.get('priceMax')),
    dateFrom: url.searchParams.get('dateFrom') ?? undefined,
    dateTo: url.searchParams.get('dateTo') ?? undefined,
    guests: toNumber(url.searchParams.get('guests')),
    sort: toSort(url.searchParams.get('sort')),
    page: toNumber(url.searchParams.get('page')),
    limit: toNumber(url.searchParams.get('limit')),
  }
}

let bookingCounter = 0

/**
 * Заглушка backend'а, реализующая контракт из ai-rules/frontend.md.
 * Логика фильтрации переиспользует ту же чистую функцию, что и мок-адаптер:
 * тест проверяет транспорт и форму ответа, а не повторяет бизнес-правила.
 */
export const handlers = [
  http.get(`${API_BASE_URL}/tours`, ({ request }) =>
    HttpResponse.json(filterTours(tours, parseQuery(new URL(request.url)))),
  ),

  http.get(`${API_BASE_URL}/tours/:id`, ({ params }) => {
    const tour = tours.find((candidate) => candidate.id === params['id'])

    return tour
      ? HttpResponse.json(tour)
      : HttpResponse.json({ message: `Тур ${String(params['id'])} не найден` }, { status: 404 })
  }),

  http.get(`${API_BASE_URL}/countries`, () => HttpResponse.json(collectCountries(tours))),

  http.post(`${API_BASE_URL}/bookings`, async ({ request }) => {
    const parsed = bookingDraftSchema.safeParse(await request.json())

    if (!parsed.success) {
      return HttpResponse.json({ message: 'Некорректные данные брони' }, { status: 400 })
    }

    const draft = parsed.data
    const tour = tours.find((candidate) => candidate.id === draft.tourId)

    if (!tour) {
      return HttpResponse.json({ message: `Тур ${draft.tourId} не найден` }, { status: 404 })
    }

    const departure = tour.departures.find((candidate) => candidate.id === draft.departureId)

    if (!departure) {
      return HttpResponse.json({ message: 'Выбранный вылет недоступен' }, { status: 400 })
    }

    if (departure.seatsLeft < draft.guests) {
      return HttpResponse.json(
        { message: `На этот вылет осталось мест: ${departure.seatsLeft}` },
        { status: 400 },
      )
    }

    bookingCounter += 1

    const booking: Booking = {
      ...draft,
      id: `BK-SRV${String(bookingCounter).padStart(3, '0')}`,
      total: calculateTotal({ pricePerPerson: tour.pricePerPerson, guests: draft.guests }).total,
      currency: 'KZT',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    bookings.set(booking.id, booking)

    return HttpResponse.json(booking, { status: 201 })
  }),

  http.get(`${API_BASE_URL}/bookings/:id`, ({ params }) => {
    const booking = bookings.get(String(params['id']))

    return booking
      ? HttpResponse.json(booking)
      : HttpResponse.json({ message: `Бронь ${String(params['id'])} не найдена` }, { status: 404 })
  }),
]

export const mswServer = setupServer(...handlers)
