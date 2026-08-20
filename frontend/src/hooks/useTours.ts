import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { DEFAULT_PAGE_SIZE, api } from '@/api'
import type { BookingDraft } from '@/types/booking'
import type { Country } from '@/types/tour'

import type { TourFilters } from './useTourFilters'

/** Каталог с подгрузкой по страницам. Фильтры входят в ключ кэша. */
export function useTours(filters: TourFilters) {
  return useInfiniteQuery({
    queryKey: ['tours', filters],
    queryFn: ({ pageParam }) =>
      api.listTours({ ...filters, page: pageParam, limit: DEFAULT_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
  })
}

export function useTour(id: number | undefined) {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => api.getTour(id as number),
    enabled: id !== undefined,
  })
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => api.listCountries(),
    staleTime: Infinity,
  })
}

/** Быстрый доступ к стране по её id — в турах приходит только countryId. */
export function useCountryLookup(): Map<number, Country> {
  const { data } = useCountries()

  return useMemo(() => new Map((data ?? []).map((country) => [country.id, country])), [data])
}

export function useBooking(id: number | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.getBooking(id as number),
    enabled: id !== undefined,
  })
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (draft: BookingDraft) => api.createBooking(draft),
  })
}

/** Разбирает числовой id из параметра маршрута. Не хук — обычная функция. */
export function parseNumericParam(value: string | undefined): number | undefined {
  if (value === undefined) return undefined

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}
