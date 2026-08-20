import { z } from 'zod'

import { BOOKING_STATUSES, type Booking } from '@/types/booking'
import type { Country, Tour } from '@/types/tour'

import type { Paginated } from './contract'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ожидается дата в формате YYYY-MM-DD')

/**
 * Схемы описывают ответ бэкенда как есть (snake_case) и превращают его
 * в доменный тип (camelCase). Это единственное место, где живёт соглашение
 * об именовании чужого API.
 *
 * Валидация здесь не формальность: расхождение бэкенда с контрактом
 * обнаруживается на границе слоя данных, а не в середине рендера.
 */
export const tourSchema = z
  .object({
    id: z.number().int(),
    title: z.string(),
    description: z.string(),
    country_id: z.number().int(),
    price: z.number(),
    currency: z.string(),
    start_date: isoDate,
    end_date: isoDate,
    duration_days: z.number().int(),
    category: z.string().optional(),
    image_url: z.string().optional(),
    created_at: z.string(),
  })
  .transform(
    (raw): Tour => ({
      id: raw.id,
      title: raw.title,
      description: raw.description,
      countryId: raw.country_id,
      price: raw.price,
      currency: raw.currency,
      startDate: raw.start_date,
      endDate: raw.end_date,
      durationDays: raw.duration_days,
      ...(raw.category ? { category: raw.category } : {}),
      ...(raw.image_url ? { imageUrl: raw.image_url } : {}),
      createdAt: raw.created_at,
    }),
  )

export const paginatedToursSchema = z
  .object({
    items: z.array(tourSchema),
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
  })
  .transform((raw): Paginated<Tour> => raw)

export const countrySchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    code: z.string(),
  })
  .transform((raw): Country => raw)

export const countriesSchema = z.array(countrySchema)

export const bookingSchema = z
  .object({
    id: z.number().int(),
    tour_id: z.number().int(),
    customer_name: z.string(),
    customer_email: z.string(),
    customer_phone: z.string(),
    num_people: z.number().int(),
    status: z.enum(BOOKING_STATUSES),
    created_at: z.string(),
  })
  .transform(
    (raw): Booking => ({
      id: raw.id,
      tourId: raw.tour_id,
      customerName: raw.customer_name,
      customerEmail: raw.customer_email,
      customerPhone: raw.customer_phone,
      numPeople: raw.num_people,
      status: raw.status,
      createdAt: raw.created_at,
    }),
  )

/** Тело ошибки бэкенда. */
export const apiErrorSchema = z.object({ error: z.string() })

/** Ответ AI-сервиса: ai-service/app/schemas.py → ChatResponse. */
export const chatReplySchema = z
  .object({ session_id: z.string(), message: z.string() })
  .transform((raw): string => raw.message)

/** Тело ошибки FastAPI: строка либо список проблем валидации. */
export const chatErrorSchema = z.object({
  detail: z.union([z.string(), z.array(z.object({ msg: z.string() }))]),
})
