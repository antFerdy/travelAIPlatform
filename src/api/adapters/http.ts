import type { Booking, BookingDraft } from '@/types/booking'
import type { Tour } from '@/types/tour'

import { ApiError, type Api, type Paginated, type TourQuery } from '../contract'
import { bookingSchema, countriesSchema, paginatedToursSchema, tourSchema } from '../schemas'

function baseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL

  if (!configured) {
    throw new ApiError(
      500,
      'Не задан VITE_API_BASE_URL — он обязателен при VITE_API_MODE=http. См. .env.example',
    )
  }

  return configured.replace(/\/$/, '')
}

function buildQuery(query: TourQuery): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }

  const serialized = params.toString()

  return serialized ? `?${serialized}` : ''
}

/**
 * Ответ сервера проверяется теми же схемами, что и мок-каталог.
 * Backend, разошедшийся с контрактом, обнаруживается на границе слоя данных,
 * а не в середине рендера.
 */
async function request<T>(path: string, schema: { parse: (data: unknown) => T }, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch (cause) {
    throw new ApiError(0, `Сервер недоступен: ${String(cause)}`)
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response))
  }

  return schema.parse(await response.json())
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const { message } = body as { message: unknown }

      if (typeof message === 'string') return message
    }
  } catch {
    // Тело не JSON — довольствуемся статусом.
  }

  return `Запрос завершился со статусом ${response.status}`
}

export const httpApi: Api = {
  listTours(query: TourQuery): Promise<Paginated<Tour>> {
    return request(`/tours${buildQuery(query)}`, paginatedToursSchema)
  },

  getTour(id: string): Promise<Tour> {
    return request(`/tours/${encodeURIComponent(id)}`, tourSchema)
  },

  listCountries(): Promise<string[]> {
    return request('/countries', countriesSchema)
  },

  createBooking(draft: BookingDraft): Promise<Booking> {
    return request('/bookings', bookingSchema, {
      method: 'POST',
      body: JSON.stringify(draft),
    })
  },

  getBooking(id: string): Promise<Booking> {
    return request(`/bookings/${encodeURIComponent(id)}`, bookingSchema)
  },
}
