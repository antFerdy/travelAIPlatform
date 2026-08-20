import type { Booking, BookingDraft } from '@/types/booking'
import type { Departure, Tour } from '@/types/tour'

let sequence = 0

/**
 * Фикстуры для тестов. Значения по умолчанию осмысленные, но неинтересные —
 * тест переопределяет ровно то, что проверяет, и это видно в его теле.
 */
export function makeDeparture(overrides: Partial<Departure> = {}): Departure {
  sequence += 1

  return {
    id: `dep-${String(sequence).padStart(2, '0')}`,
    startDate: '2026-09-12',
    endDate: '2026-09-19',
    seatsLeft: 10,
    ...overrides,
  }
}

export function makeTour(overrides: Partial<Tour> = {}): Tour {
  sequence += 1

  return {
    id: `tr-test-${String(sequence).padStart(2, '0')}`,
    title: 'Тестовый тур',
    country: 'Турция',
    city: 'Анталия',
    description: 'Описание тестового тура.',
    images: ['https://images.unsplash.com/photo-1?w=1200&q=80'],
    pricePerPerson: 400_000,
    currency: 'KZT',
    nights: 7,
    rating: 4.5,
    reviewsCount: 100,
    hotelStars: 4,
    mealPlan: 'AI',
    includes: ['Перелёт', 'Трансфер'],
    departures: [makeDeparture()],
    ...overrides,
  }
}

export function makeBookingDraft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return {
    tourId: 'tr-test-01',
    departureId: 'dep-01',
    customer: {
      name: 'Айгерим Сериковна',
      email: 'aigerim@example.kz',
      phone: '+7 701 000 00 00',
    },
    guests: 2,
    ...overrides,
  }
}

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    ...makeBookingDraft(),
    id: 'BK-ABC123',
    total: 800_000,
    currency: 'KZT',
    status: 'pending',
    createdAt: '2026-08-20T10:15:00.000Z',
    ...overrides,
  }
}
