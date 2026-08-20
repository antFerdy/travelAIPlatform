import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { z } from 'zod'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/**
 * Набор фильтров повторяет query-параметры `GET /api/v1/tours` — ничего,
 * чего бэкенд не умеет, здесь нет. Каждое поле гасит собственную ошибку
 * через `.catch`: один битый параметр в ссылке не должен обнулять остальные.
 */
const filtersSchema = z.object({
  countryId: z.coerce.number().int().positive().optional().catch(undefined),
  minPrice: z.coerce.number().nonnegative().optional().catch(undefined),
  maxPrice: z.coerce.number().nonnegative().optional().catch(undefined),
  dateFrom: isoDate.optional().catch(undefined),
  dateTo: isoDate.optional().catch(undefined),
})

export type TourFilters = z.infer<typeof filtersSchema>

export const FILTER_KEYS = [
  'countryId',
  'minPrice',
  'maxPrice',
  'dateFrom',
  'dateTo',
] as const satisfies readonly (keyof TourFilters)[]

export function parseFilters(params: URLSearchParams): TourFilters {
  const raw: Record<string, string> = {}

  for (const key of FILTER_KEYS) {
    const value = params.get(key)

    if (value !== null && value !== '') {
      raw[key] = value
    }
  }

  return filtersSchema.parse(raw)
}

export function countActiveFilters(filters: TourFilters): number {
  return FILTER_KEYS.filter((key) => filters[key] !== undefined).length
}

/**
 * Фильтры живут в строке запроса, а не в состоянии React.
 *
 * Благодаря этому выдача открывается по ссылке, переживает перезагрузку
 * и корректно отрабатывает кнопку «назад».
 */
export function useTourFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const setFilters = useCallback(
    (patch: Partial<TourFilters>) => {
      const next = new URLSearchParams(searchParams)

      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === '') {
          next.delete(key)
        } else {
          next.set(key, String(value))
        }
      }

      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  return {
    filters,
    setFilters,
    resetFilters,
    activeCount: countActiveFilters(filters),
  }
}
