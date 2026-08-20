import { calculateTotal } from '@/domain/pricing'
import rawTours from '@/mocks/tours.json'
import type { Booking, BookingDraft } from '@/types/booking'
import type { Tour } from '@/types/tour'

import { ApiError, type Api, type Paginated, type TourQuery } from '../contract'
import { collectCountries, filterTours } from '../filterTours'
import { bookingsRecordSchema, toursSchema } from '../schemas'

const BOOKINGS_STORAGE_KEY = 'travel:bookings'

/**
 * Каталог валидируется на импорте: если мок-файл разошёлся с контрактом,
 * приложение падает сразу и громко, а не выдаёт битые карточки на экране.
 */
const tours: Tour[] = toursSchema.parse(rawTours)

function mockLatency(): number {
  if (import.meta.env.MODE === 'test') return 0

  return Number(import.meta.env.VITE_MOCK_LATENCY ?? 300)
}

function delay(): Promise<void> {
  const ms = mockLatency()

  if (ms <= 0) return Promise.resolve()

  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readBookings(): Record<string, Booking> {
  const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY)

  if (!raw) return {}

  try {
    return bookingsRecordSchema.parse(JSON.parse(raw))
  } catch {
    // Устаревший или испорченный формат — начинаем с чистого листа,
    // это мок-хранилище, терять здесь нечего.
    localStorage.removeItem(BOOKINGS_STORAGE_KEY)

    return {}
  }
}

function writeBookings(bookings: Record<string, Booking>): void {
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings))
}

function generateBookingId(): string {
  const bytes = new Uint8Array(3)
  crypto.getRandomValues(bytes)

  const suffix = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

  return `BK-${suffix}`
}

export const mockApi: Api = {
  async listTours(query: TourQuery): Promise<Paginated<Tour>> {
    await delay()

    return filterTours(tours, query)
  },

  async getTour(id: string): Promise<Tour> {
    await delay()

    const tour = tours.find((candidate) => candidate.id === id)

    if (!tour) {
      throw new ApiError(404, `Тур ${id} не найден`)
    }

    return tour
  },

  async listCountries(): Promise<string[]> {
    await delay()

    return collectCountries(tours)
  },

  async createBooking(draft: BookingDraft): Promise<Booking> {
    await delay()

    const tour = tours.find((candidate) => candidate.id === draft.tourId)

    if (!tour) {
      throw new ApiError(404, `Тур ${draft.tourId} не найден`)
    }

    const departure = tour.departures.find((candidate) => candidate.id === draft.departureId)

    if (!departure) {
      throw new ApiError(400, 'Выбранный вылет недоступен')
    }

    if (departure.seatsLeft < draft.guests) {
      throw new ApiError(400, `На этот вылет осталось мест: ${departure.seatsLeft}`)
    }

    const { total } = calculateTotal({
      pricePerPerson: tour.pricePerPerson,
      guests: draft.guests,
    })

    const booking: Booking = {
      ...draft,
      id: generateBookingId(),
      total,
      currency: 'KZT',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const bookings = readBookings()
    bookings[booking.id] = booking
    writeBookings(bookings)

    return booking
  },

  async getBooking(id: string): Promise<Booking> {
    await delay()

    const booking = readBookings()[id]

    if (!booking) {
      throw new ApiError(404, `Бронь ${id} не найдена`)
    }

    return booking
  },
}
