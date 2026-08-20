import type { Departure, Tour } from '@/types/tour'

/**
 * Даты вылета хранятся как YYYY-MM-DD, поэтому сравниваются лексикографически.
 * Это исключает сдвиги часовых поясов — типичный источник ошибок «на один день».
 */
export type DateWindow = {
  /** YYYY-MM-DD */
  dateFrom?: string | undefined
  /** YYYY-MM-DD */
  dateTo?: string | undefined
}

/**
 * Попадает ли вылет в выбранное пользователем окно.
 *
 * Проверяется дата *начала* тура: пользователь выбирает, когда он хочет улететь,
 * а не требует, чтобы весь тур целиком уложился в интервал.
 */
export function matchesDateWindow(departure: Departure, window: DateWindow): boolean {
  const { dateFrom, dateTo } = window

  if (dateFrom && departure.startDate < dateFrom) return false
  if (dateTo && departure.startDate > dateTo) return false

  return true
}

/** Хватает ли на вылете свободных мест на всех гостей. */
export function hasSeats(departure: Departure, guests: number): boolean {
  return departure.seatsLeft >= guests
}

/** Вылеты, которые ещё не состоялись, по возрастанию даты. */
export function upcomingDepartures(tour: Tour, today: string = todayIso()): Departure[] {
  return tour.departures
    .filter((departure) => departure.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

/** Ближайший доступный вылет либо undefined, если тур больше не летает. */
export function nearestDeparture(tour: Tour, today: string = todayIso()): Departure | undefined {
  return upcomingDepartures(tour, today)[0]
}

/** Есть ли у тура хоть один вылет, подходящий под фильтр. */
export function hasMatchingDeparture(
  tour: Tour,
  window: DateWindow,
  guests?: number | undefined,
): boolean {
  return tour.departures.some(
    (departure) =>
      matchesDateWindow(departure, window) && (guests === undefined || hasSeats(departure, guests)),
  )
}

/** Сегодняшняя дата в формате YYYY-MM-DD по локальному календарю. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}
