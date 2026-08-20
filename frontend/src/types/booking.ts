export const MIN_PEOPLE = 1

/**
 * Бэкенд требует только num_people > 0. Верхняя граница — ограничение формы,
 * чтобы выпадающий список оставался обозримым.
 */
export const MAX_PEOPLE = 20

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Ожидает подтверждения менеджера',
  confirmed: 'Подтверждена',
  cancelled: 'Отменена',
}

/** Тело POST /api/v1/bookings. */
export type BookingDraft = {
  tourId: number
  customerName: string
  customerEmail: string
  customerPhone: string
  numPeople: number
}

/**
 * Ответ бэкенда. Суммы здесь нет: бронь — это заявка без расчёта и оплаты.
 */
export type Booking = BookingDraft & {
  id: number
  status: BookingStatus
  /** RFC 3339 */
  createdAt: string
}
