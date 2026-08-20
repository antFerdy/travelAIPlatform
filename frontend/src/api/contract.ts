import type { Booking, BookingDraft } from '@/types/booking'
import type { Country, Tour } from '@/types/tour'

/** Умолчание бэкенда для limit. */
export const DEFAULT_PAGE_SIZE = 20

/** Бэкенд обрезает limit до этого значения. */
export const MAX_PAGE_SIZE = 100

/**
 * Фильтры каталога — ровно те, что понимает `GET /api/v1/tours`.
 * Сортировки в API нет, поэтому её нет и здесь.
 */
export type TourQuery = {
  countryId?: number | undefined
  minPrice?: number | undefined
  maxPrice?: number | undefined
  /** YYYY-MM-DD. Бэкенд отбирает туры, у которых end_date >= dateFrom. */
  dateFrom?: string | undefined
  /** YYYY-MM-DD. Бэкенд отбирает туры, у которых start_date <= dateTo. */
  dateTo?: string | undefined
  /** С единицы. */
  page?: number | undefined
  limit?: number | undefined
}

export type Paginated<T> = {
  items: T[]
  page: number
  limit: number
  total: number
}

/**
 * Ошибка слоя данных. Тело ошибки у бэкенда — `{ "error": "..." }`,
 * коды: 404 не найдено, 422 не прошло валидацию, 500 сбой сервера.
 * status 0 означает, что до сервера вообще не достучались.
 */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }

  /** Сообщение, которое не стыдно показать пользователю. */
  get userMessage(): string {
    if (this.status === 0) return 'Сервер недоступен. Проверьте, запущен ли бэкенд.'
    if (this.status === 404) return 'Не найдено.'
    if (this.status >= 500) return 'Сервер вернул ошибку. Попробуйте позже.'

    return this.message
  }
}

/**
 * Контракт слоя данных. Всё приложение знает только его.
 * Реализация — src/api/adapters/http.ts, спецификация —
 * docs/superpowers/specs/api.md.
 */
export interface Api {
  listTours(query: TourQuery): Promise<Paginated<Tour>>
  getTour(id: number): Promise<Tour>
  listCountries(): Promise<Country[]>
  createBooking(draft: BookingDraft): Promise<Booking>
  getBooking(id: number): Promise<Booking>
}

/** Максимальная длина сообщения, которую принимает ai-service. */
export const MAX_CHAT_MESSAGE_LENGTH = 2000

/** Формат session_id из ai-service/app/schemas.py. */
export const CHAT_SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,100}$/

/**
 * Запрос к AI-помощнику. session_id стабилен между сообщениями:
 * историю диалога хранит сам сервис, клиент её не пересылает.
 */
export type ChatRequest = {
  sessionId: string
  message: string
}

/**
 * Контракт AI-сервиса — отдельный от каталога: другой адрес, другой формат
 * ошибок (FastAPI отвечает полем detail) и своя доступность. Каталог обязан
 * работать, даже когда помощник лежит.
 */
export interface ChatApi {
  sendMessage(input: ChatRequest): Promise<string>
}
