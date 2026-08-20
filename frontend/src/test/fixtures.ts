import type { Booking, BookingDraft } from '@/types/booking'
import type { Country, Tour } from '@/types/tour'

/**
 * Тестовые данные в форме, которую отдаёт бэкенд. Повторяют структуру
 * backend/internal/db/seed/seed.sql: один отель — несколько туров с разными
 * датами и ценой, страны только те, что есть в сиде.
 *
 * Это фикстуры для тестов, а не данные приложения: боевой каталог приходит
 * из API, мок-адаптера у фронтенда больше нет.
 */
export const COUNTRIES: Country[] = [
  { id: 1, name: 'ОАЭ', code: 'AE' },
  { id: 2, name: 'Турция', code: 'TR' },
]

type HotelTemplate = {
  title: string
  description: string
  countryId: number
  basePrice: number
  durationDays: number
  category: string
  imageUrl?: string
}

const HOTELS: HotelTemplate[] = [
  {
    title: 'ОАЭ: Hampton by Hilton Marjan Island, 7 ночей',
    description: 'Подходит для пляжного отдыха в Рас-эль-Хайме. Пляжный отель для семей и пар.',
    countryId: 1,
    basePrice: 845000,
    durationDays: 7,
    category: 'beach',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  },
  {
    title: 'Стамбул: Kaya Madrid Hotel, 9 ночей',
    description: 'Городской отель в Стамбуле с рестораном и баром.',
    countryId: 2,
    basePrice: 735000,
    durationDays: 9,
    category: 'city',
    imageUrl: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
  },
  {
    title: 'Стамбул: Miklagord, 7 ночей',
    description: 'Подходит для недельного city-break в Стамбуле.',
    countryId: 2,
    basePrice: 690000,
    durationDays: 7,
    category: 'city',
  },
  {
    title: 'Стамбул: Divas Hotel, 7 ночей',
    description: 'Вариант для туристов, у которых цена важнее рейтинга отеля.',
    countryId: 2,
    basePrice: 665000,
    durationDays: 7,
    category: 'city',
    imageUrl: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200&q=80',
  },
  {
    title: 'ОАЭ: Hampton by Hilton Marjan Island, 7 ночей из Астаны',
    description: 'Тот же отель, вылет из Астаны.',
    countryId: 1,
    basePrice: 875000,
    durationDays: 7,
    category: 'beach',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  },
  {
    title: 'Стамбул: Grand Ant Hotel, 9 ночей',
    description: 'Универсальный пакет для поездки в Стамбул.',
    countryId: 2,
    basePrice: 795000,
    durationDays: 9,
    category: 'city',
  },
]

/** Даты заездов, как в сиде: четыре окна с сентября по октябрь. */
const DEPARTURES = ['2026-09-05', '2026-09-12', '2026-09-20', '2026-10-03']

/** Множители цены по заезду — цена зависит от даты, как в реальных данных. */
const PRICE_FACTORS = [1, 1.04, 0.97, 1.08]

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)

  return date.toISOString().slice(0, 10)
}

/** 24 тура: шесть отелей × четыре заезда. Хватает, чтобы работала пагинация. */
export const TOURS: Tour[] = HOTELS.flatMap((hotel, hotelIndex) =>
  DEPARTURES.map((startDate, departureIndex): Tour => {
    const id = hotelIndex * DEPARTURES.length + departureIndex + 1

    return {
      id,
      title: hotel.title,
      description: hotel.description,
      countryId: hotel.countryId,
      price: Math.round(hotel.basePrice * (PRICE_FACTORS[departureIndex] ?? 1)),
      currency: 'KZT',
      startDate,
      endDate: addDays(startDate, hotel.durationDays),
      durationDays: hotel.durationDays,
      category: hotel.category,
      ...(hotel.imageUrl ? { imageUrl: hotel.imageUrl } : {}),
      createdAt: '2026-08-20T15:51:12Z',
    }
  }),
)

export function makeTour(overrides: Partial<Tour> = {}): Tour {
  const base = TOURS[0]

  if (!base) throw new Error('Фикстура каталога пуста')

  return { ...base, ...overrides }
}

export function makeBookingDraft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return {
    tourId: 1,
    customerName: 'Айгерим Сериковна',
    customerEmail: 'aigerim@example.kz',
    customerPhone: '+7 701 000 00 00',
    numPeople: 2,
    ...overrides,
  }
}

export function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    ...makeBookingDraft(),
    id: 1,
    status: 'pending',
    createdAt: '2026-08-20T16:12:08Z',
    ...overrides,
  }
}
