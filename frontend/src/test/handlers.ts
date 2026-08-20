import { HttpResponse, http } from 'msw'

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/api/contract'
import type { Booking } from '@/types/booking'
import type { Tour } from '@/types/tour'

import { COUNTRIES, TOURS } from './fixtures'

export const API_ORIGIN = 'http://api.test'
const BASE = `${API_ORIGIN}/api/v1`

/**
 * Заглушка бэкенда, реализующая docs/superpowers/specs/api.md буква в букву:
 * snake_case в теле, ошибки вида { error }, 422 на невалидный ввод,
 * пересечение диапазонов дат вместо вложенности.
 *
 * Это единственный дублёр сервера в проекте. Мок-адаптера у приложения нет —
 * фронтенд всегда ходит по HTTP, в тестах его перехватывает MSW.
 */
const bookings = new Map<number, Booking>()
let nextBookingId = 1

export function resetBackendState(): void {
  bookings.clear()
  nextBookingId = 1
}

function toWire(tour: Tour) {
  return {
    id: tour.id,
    title: tour.title,
    description: tour.description,
    country_id: tour.countryId,
    price: tour.price,
    currency: tour.currency,
    start_date: tour.startDate,
    end_date: tour.endDate,
    duration_days: tour.durationDays,
    ...(tour.category ? { category: tour.category } : {}),
    ...(tour.imageUrl ? { image_url: tour.imageUrl } : {}),
    created_at: tour.createdAt,
  }
}

function bookingToWire(booking: Booking) {
  return {
    id: booking.id,
    tour_id: booking.tourId,
    customer_name: booking.customerName,
    customer_email: booking.customerEmail,
    customer_phone: booking.customerPhone,
    num_people: booking.numPeople,
    status: booking.status,
    created_at: booking.createdAt,
  }
}

function fail(status: number, error: string) {
  return HttpResponse.json({ error }, { status })
}

class Invalid extends Error {}

function intParam(url: URL, name: string): number | undefined {
  const raw = url.searchParams.get(name)

  if (raw === null || raw === '') return undefined

  const parsed = Number(raw)

  if (!Number.isInteger(parsed)) throw new Invalid(`invalid ${name}`)

  return parsed
}

function numberParam(url: URL, name: string): number | undefined {
  const raw = url.searchParams.get(name)

  if (raw === null || raw === '') return undefined

  const parsed = Number(raw)

  if (!Number.isFinite(parsed)) throw new Invalid(`invalid ${name}`)

  return parsed
}

function dateParam(url: URL, name: string): string | undefined {
  const raw = url.searchParams.get(name)

  if (raw === null || raw === '') return undefined

  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Invalid(`invalid ${name}`)

  return raw
}

export const handlers = [
  http.get(`${API_ORIGIN}/health`, () => HttpResponse.json({ status: 'ok' })),

  http.get(`${BASE}/countries`, () => HttpResponse.json(COUNTRIES)),

  http.get(`${BASE}/tours`, ({ request }) => {
    const url = new URL(request.url)

    let countryId: number | undefined
    let minPrice: number | undefined
    let maxPrice: number | undefined
    let dateFrom: string | undefined
    let dateTo: string | undefined
    let page: number
    let limit: number

    try {
      countryId = intParam(url, 'country_id')
      minPrice = numberParam(url, 'min_price')
      maxPrice = numberParam(url, 'max_price')
      dateFrom = dateParam(url, 'date_from')
      dateTo = dateParam(url, 'date_to')
      page = intParam(url, 'page') ?? 1
      limit = intParam(url, 'limit') ?? DEFAULT_PAGE_SIZE
    } catch (cause) {
      return fail(422, cause instanceof Invalid ? cause.message : 'invalid query')
    }

    if (page < 1) return fail(422, 'page must be >= 1')
    if (limit < 1) return fail(422, 'limit must be >= 1')

    limit = Math.min(limit, MAX_PAGE_SIZE)

    const matched = TOURS.filter((tour) => {
      if (countryId !== undefined && tour.countryId !== countryId) return false
      if (minPrice !== undefined && tour.price < minPrice) return false
      if (maxPrice !== undefined && tour.price > maxPrice) return false
      // Пересечение диапазонов, а не вложенность — так описано в спецификации
      if (dateFrom !== undefined && tour.endDate < dateFrom) return false
      if (dateTo !== undefined && tour.startDate > dateTo) return false

      return true
    })

    const offset = (page - 1) * limit

    return HttpResponse.json({
      items: matched.slice(offset, offset + limit).map(toWire),
      page,
      limit,
      total: matched.length,
    })
  }),

  http.get(`${BASE}/tours/:id`, ({ params }) => {
    const id = Number(params['id'])
    const tour = TOURS.find((candidate) => candidate.id === id)

    return tour ? HttpResponse.json(toWire(tour)) : fail(404, `tour ${params['id']} not found`)
  }),

  http.post(`${BASE}/bookings`, async ({ request }) => {
    let body: unknown

    try {
      body = await request.json()
    } catch {
      return fail(422, 'invalid request body')
    }

    if (typeof body !== 'object' || body === null) return fail(422, 'invalid request body')

    const raw = body as Record<string, unknown>
    const tourId = raw['tour_id']
    const name = raw['customer_name']
    const email = raw['customer_email']
    const phone = raw['customer_phone']
    const numPeople = raw['num_people']

    if (typeof name !== 'string' || name.trim() === '') {
      return fail(422, "validation failed: Field validation for 'CustomerName' failed")
    }

    if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return fail(422, "validation failed: Field validation for 'CustomerEmail' failed on the 'email' tag")
    }

    if (typeof phone !== 'string' || phone.trim() === '') {
      return fail(422, "validation failed: Field validation for 'CustomerPhone' failed")
    }

    if (typeof numPeople !== 'number' || !Number.isInteger(numPeople) || numPeople <= 0) {
      return fail(422, "validation failed: Field validation for 'NumPeople' failed on the 'gt' tag")
    }

    if (typeof tourId !== 'number' || !TOURS.some((tour) => tour.id === tourId)) {
      return fail(404, `tour ${String(tourId)} not found`)
    }

    const booking: Booking = {
      id: nextBookingId,
      tourId,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      numPeople,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    nextBookingId += 1
    bookings.set(booking.id, booking)

    return HttpResponse.json(bookingToWire(booking), { status: 201 })
  }),

  http.get(`${BASE}/bookings/:id`, ({ params }) => {
    const booking = bookings.get(Number(params['id']))

    return booking
      ? HttpResponse.json(bookingToWire(booking))
      : fail(404, `booking ${params['id']} not found`)
  }),
]
