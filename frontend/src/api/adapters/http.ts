import type { Booking, BookingDraft } from '@/types/booking'
import type { Country, Tour } from '@/types/tour'

import { ApiError, type Api, type Paginated, type TourQuery } from '../contract'
import { apiErrorSchema, bookingSchema, countriesSchema, paginatedToursSchema, tourSchema } from '../schemas'

/** Все ручки, кроме /health, живут под этим префиксом. */
const API_PREFIX = '/api/v1'

function baseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL

  if (!configured) {
    throw new ApiError(0, 'Не задан VITE_API_BASE_URL. См. .env.example')
  }

  return configured.replace(/\/$/, '') + API_PREFIX
}

/** Имена параметров — как в API: snake_case. */
function buildQuery(query: TourQuery): string {
  const params = new URLSearchParams()
  const mapping: [keyof TourQuery, string][] = [
    ['countryId', 'country_id'],
    ['minPrice', 'min_price'],
    ['maxPrice', 'max_price'],
    ['dateFrom', 'date_from'],
    ['dateTo', 'date_to'],
    ['page', 'page'],
    ['limit', 'limit'],
  ]

  for (const [key, param] of mapping) {
    const value = query[key]

    if (value !== undefined && value !== '') {
      params.set(param, String(value))
    }
  }

  const serialized = params.toString()

  return serialized ? `?${serialized}` : ''
}

async function readError(response: Response): Promise<string> {
  try {
    const parsed = apiErrorSchema.safeParse(await response.json())

    if (parsed.success) return parsed.data.error
  } catch {
    // Тело не JSON — довольствуемся статусом.
  }

  return `Запрос завершился со статусом ${response.status}`
}

async function request<T>(
  path: string,
  schema: { parse: (data: unknown) => T },
  init?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch (cause) {
    throw new ApiError(0, `Сервер недоступен: ${String(cause)}`)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readError(response))
  }

  return schema.parse(await response.json())
}

export const httpApi: Api = {
  listTours(query: TourQuery): Promise<Paginated<Tour>> {
    return request(`/tours${buildQuery(query)}`, paginatedToursSchema)
  },

  getTour(id: number): Promise<Tour> {
    return request(`/tours/${id}`, tourSchema)
  },

  listCountries(): Promise<Country[]> {
    return request('/countries', countriesSchema)
  },

  createBooking(draft: BookingDraft): Promise<Booking> {
    return request('/bookings', bookingSchema, {
      method: 'POST',
      body: JSON.stringify({
        tour_id: draft.tourId,
        customer_name: draft.customerName,
        customer_email: draft.customerEmail,
        customer_phone: draft.customerPhone,
        num_people: draft.numPeople,
      }),
    })
  },

  getBooking(id: number): Promise<Booking> {
    return request(`/bookings/${id}`, bookingSchema)
  },
}
