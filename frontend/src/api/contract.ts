import type { Booking, BookingDraft } from '@/types/booking'
import type { Tour } from '@/types/tour'

export const SORT_OPTIONS = ['departure-asc', 'price-asc', 'price-desc', 'rating-desc'] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export const SORT_LABELS: Record<SortOption, string> = {
  'departure-asc': 'Сначала ближайшие вылеты',
  'price-asc': 'Сначала дешёвые',
  'price-desc': 'Сначала дорогие',
  'rating-desc': 'По рейтингу',
}

export const DEFAULT_SORT: SortOption = 'departure-asc'
export const DEFAULT_PAGE_SIZE = 9

export type TourQuery = {
  country?: string | undefined
  /** Целое число тенге. */
  priceMin?: number | undefined
  /** Целое число тенге. */
  priceMax?: number | undefined
  /** YYYY-MM-DD */
  dateFrom?: string | undefined
  /** YYYY-MM-DD */
  dateTo?: string | undefined
  guests?: number | undefined
  sort?: SortOption | undefined
  /** С единицы. */
  page?: number | undefined
  limit?: number | undefined
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

/**
 * Единый тип ошибки для обоих адаптеров.
 *
 * Мок и HTTP обязаны падать одинаково — иначе экраны, отлаженные на моках,
 * поведут себя иначе с реальным backend'ом.
 */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Контракт слоя данных. Всё приложение знает только его.
 *
 * Реализации: src/api/adapters/mock.ts и src/api/adapters/http.ts.
 * Выбор реализации — src/api/index.ts по VITE_API_MODE.
 */
export interface Api {
  listTours(query: TourQuery): Promise<Paginated<Tour>>
  getTour(id: string): Promise<Tour>
  listCountries(): Promise<string[]>
  createBooking(draft: BookingDraft): Promise<Booking>
  getBooking(id: string): Promise<Booking>
}
