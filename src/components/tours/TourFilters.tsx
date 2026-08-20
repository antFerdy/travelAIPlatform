import { useEffect, useState } from 'react'

import { SORT_LABELS, SORT_OPTIONS, type SortOption } from '@/api'
import { todayIso } from '@/domain/availability'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { TourFilters as Filters } from '@/hooks/useTourFilters'
import { MAX_GUESTS, MIN_GUESTS } from '@/types/booking'

import { Button } from '../ui/Button'
import { InputField, SelectField } from '../ui/Field'

export type TourFiltersProps = {
  filters: Filters
  countries: string[]
  activeCount: number
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

/** Сужение строки из <select> до SortOption без приведения типов. */
const toSort = (value: string): SortOption | undefined =>
  SORT_OPTIONS.find((option) => option === value)

const toNumber = (value: string): number | undefined => {
  const trimmed = value.trim()

  if (trimmed === '') return undefined

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : undefined
}

export function TourFilters({
  filters,
  countries,
  activeCount,
  onChange,
  onReset,
}: TourFiltersProps) {
  // Цена вводится посимвольно, поэтому в URL уходит отложенно.
  const [priceMin, setPriceMin] = useState(filters.priceMin?.toString() ?? '')
  const [priceMax, setPriceMax] = useState(filters.priceMax?.toString() ?? '')

  const debouncedMin = useDebouncedValue(priceMin)
  const debouncedMax = useDebouncedValue(priceMax)

  useEffect(() => {
    const next = toNumber(debouncedMin)

    if (next !== filters.priceMin) onChange({ priceMin: next })
    // Фильтры — единственный источник истины; onChange стабилен по ссылке достаточно,
    // но повторный вызов при его смене привёл бы к циклу.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMin])

  useEffect(() => {
    const next = toNumber(debouncedMax)

    if (next !== filters.priceMax) onChange({ priceMax: next })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMax])

  const handleReset = () => {
    setPriceMin('')
    setPriceMax('')
    onReset()
  }

  return (
    <section
      aria-label="Фильтры подбора туров"
      className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Страна"
          value={filters.country ?? ''}
          onChange={(event) => onChange({ country: event.target.value || undefined })}
        >
          <option value="">Любая</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Сортировка"
          value={filters.sort ?? ''}
          onChange={(event) => onChange({ sort: toSort(event.target.value) })}
        >
          <option value="">По умолчанию</option>
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Гостей"
          value={filters.guests?.toString() ?? ''}
          onChange={(event) =>
            onChange({ guests: event.target.value ? Number(event.target.value) : undefined })
          }
        >
          <option value="">Не важно</option>
          {Array.from({ length: MAX_GUESTS - MIN_GUESTS + 1 }, (_, index) => index + MIN_GUESTS).map(
            (count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ),
          )}
        </SelectField>

        <InputField
          label="Цена от, ₸"
          type="number"
          inputMode="numeric"
          min={0}
          step={5000}
          placeholder="180 000"
          value={priceMin}
          onChange={(event) => setPriceMin(event.target.value)}
        />

        <InputField
          label="Цена до, ₸"
          type="number"
          inputMode="numeric"
          min={0}
          step={5000}
          placeholder="2 500 000"
          value={priceMax}
          onChange={(event) => setPriceMax(event.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="Вылет с"
            type="date"
            min={todayIso()}
            value={filters.dateFrom ?? ''}
            onChange={(event) => onChange({ dateFrom: event.target.value || undefined })}
          />
          <InputField
            label="Вылет по"
            type="date"
            min={filters.dateFrom ?? todayIso()}
            value={filters.dateTo ?? ''}
            onChange={(event) => onChange({ dateTo: event.target.value || undefined })}
          />
        </div>
      </div>

      {activeCount > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-ink-500 text-sm">Активных фильтров: {activeCount}</p>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Сбросить всё
          </Button>
        </div>
      ) : null}
    </section>
  )
}
