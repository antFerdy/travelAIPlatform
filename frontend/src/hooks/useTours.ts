import { useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query'

import { DEFAULT_PAGE_SIZE, api } from '@/api'
import type { BookingDraft } from '@/types/booking'

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

export function useTour(id: string | undefined) {
  return useQuery({
    queryKey: ['tour', id],
    queryFn: () => api.getTour(id as string),
    enabled: Boolean(id),
  })
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: () => api.listCountries(),
    staleTime: Infinity,
  })
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => api.getBooking(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: (draft: BookingDraft) => api.createBooking(draft),
  })
}
