export const MIN_GUESTS = 1
export const MAX_GUESTS = 10

export type BookingCustomer = {
  name: string
  email: string
  phone: string
}

/** То, что отправляется на создание брони. */
export type BookingDraft = {
  tourId: string
  departureId: string
  customer: BookingCustomer
  guests: number
  comment?: string
}

/**
 * Оплаты в продукте нет, поэтому созданная бронь всегда ждёт подтверждения
 * менеджером. Значение выделено в тип, чтобы backend не расширил его молча.
 */
export type BookingStatus = 'pending'

export type Booking = BookingDraft & {
  /** Человекочитаемый номер брони, например BK-7F3A21. */
  id: string
  /** Сумма на момент бронирования, целое число тенге. */
  total: number
  currency: 'KZT'
  status: BookingStatus
  /** ISO 8601, UTC. */
  createdAt: string
}
