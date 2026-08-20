import { z } from 'zod'

import { MAX_GUESTS, MIN_GUESTS, type Booking, type BookingDraft } from '@/types/booking'
import { MEAL_PLANS, type Departure, type Tour } from '@/types/tour'

import type { Paginated } from './contract'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ожидается дата в формате YYYY-MM-DD')

export const departureSchema: z.ZodType<Departure> = z.object({
  id: z.string().min(1),
  startDate: isoDate,
  endDate: isoDate,
  seatsLeft: z.number().int().min(0),
})

export const tourSchema: z.ZodType<Tour> = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  description: z.string().min(1),
  images: z.array(z.string().url()).min(1),
  pricePerPerson: z.number().int().nonnegative(),
  currency: z.literal('KZT'),
  nights: z.number().int().positive(),
  rating: z.number().min(0).max(5),
  reviewsCount: z.number().int().nonnegative(),
  hotelStars: z.number().int().min(1).max(5),
  mealPlan: z.enum(MEAL_PLANS),
  includes: z.array(z.string()),
  departures: z.array(departureSchema),
})

export const toursSchema = z.array(tourSchema)

export const paginatedToursSchema: z.ZodType<Paginated<Tour>> = z.object({
  items: toursSchema,
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
})

export const countriesSchema = z.array(z.string())

export const bookingCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
})

export const bookingDraftSchema: z.ZodType<BookingDraft> = z.object({
  tourId: z.string().min(1),
  departureId: z.string().min(1),
  customer: bookingCustomerSchema,
  guests: z.number().int().min(MIN_GUESTS).max(MAX_GUESTS),
  comment: z.string().optional(),
})

export const bookingSchema: z.ZodType<Booking> = z.object({
  id: z.string().min(1),
  tourId: z.string().min(1),
  departureId: z.string().min(1),
  customer: bookingCustomerSchema,
  guests: z.number().int().min(MIN_GUESTS).max(MAX_GUESTS),
  comment: z.string().optional(),
  total: z.number().int().nonnegative(),
  currency: z.literal('KZT'),
  status: z.literal('pending'),
  createdAt: z.string().min(1),
})

export const bookingsRecordSchema = z.record(z.string(), bookingSchema)
