import { hasMatchingDeparture, nearestDeparture } from '@/domain/availability'
import type { Tour } from '@/types/tour'

import { DEFAULT_PAGE_SIZE, DEFAULT_SORT, type Paginated, type SortOption, type TourQuery } from './contract'

/**
 * Фильтрация, сортировка и пагинация каталога.
 *
 * Чистая функция: используется мок-адаптером и служит эталоном поведения,
 * которое обязан повторить backend в `GET /tours`.
 */
export function filterTours(tours: Tour[], query: TourQuery): Paginated<Tour> {
  const matched = tours.filter((tour) => matchesQuery(tour, query))
  const sorted = sortTours(matched, query.sort ?? DEFAULT_SORT)

  const limit = Math.max(1, query.limit ?? DEFAULT_PAGE_SIZE)
  const page = Math.max(1, query.page ?? 1)
  const offset = (page - 1) * limit

  return {
    items: sorted.slice(offset, offset + limit),
    total: sorted.length,
    page,
    limit,
  }
}

function matchesQuery(tour: Tour, query: TourQuery): boolean {
  const { country, priceMin, priceMax, dateFrom, dateTo, guests } = query

  if (country && tour.country !== country) return false
  if (priceMin !== undefined && tour.pricePerPerson < priceMin) return false
  if (priceMax !== undefined && tour.pricePerPerson > priceMax) return false

  // Фильтр по датам и местам проверяется на уровне вылетов: тур подходит,
  // если у него есть хотя бы один вылет, удовлетворяющий условиям.
  if (dateFrom || dateTo || guests !== undefined) {
    return hasMatchingDeparture(tour, { dateFrom, dateTo }, guests)
  }

  return true
}

function sortTours(tours: Tour[], sort: SortOption): Tour[] {
  const sorted = [...tours]

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.pricePerPerson - b.pricePerPerson)
    case 'price-desc':
      return sorted.sort((a, b) => b.pricePerPerson - a.pricePerPerson)
    case 'rating-desc':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'departure-asc':
      return sorted.sort((a, b) => departureSortKey(a).localeCompare(departureSortKey(b)))
  }
}

/** Туры без предстоящих вылетов уезжают в конец списка. */
function departureSortKey(tour: Tour): string {
  return nearestDeparture(tour)?.startDate ?? '9999-12-31'
}

/** Список стран каталога, по алфавиту, без повторов. */
export function collectCountries(tours: Tour[]): string[] {
  return [...new Set(tours.map((tour) => tour.country))].sort((a, b) => a.localeCompare(b, 'ru'))
}
