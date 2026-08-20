import type { KeyboardEvent } from 'react'

import { SORT_LABELS, SORT_OPTIONS, type SortOption } from '@/api'
import { todayIso } from '@/domain/availability'
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
  /**
   * Поля цены неуправляемые и пересоздаются через `key` при смене применённого
   * значения. Так строка запроса остаётся единственным источником истины:
   * зеркалить её в состояние компонента — значит заводить вторую копию, которая
   * рано или поздно разойдётся с URL (кнопка «назад», сброс фильтров, переход
   * по ссылке). Значение уходит в фильтр по Enter или потере фокуса.
   */
  const commitPrice = (key: 'priceMin' | 'priceMax', value: string) => {
    const next = toNumber(value)

    if (next !== filters[key]) onChange({ [key]: next })
  }

  const priceKeyHandler = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
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
          key={`priceMin-${filters.priceMin ?? ''}`}
          label="Цена от, ₸"
          type="number"
          inputMode="numeric"
          min={0}
          step={5000}
          placeholder="180 000"
          hint="Enter или переход к другому полю применяет цену"
          defaultValue={filters.priceMin ?? ''}
          onBlur={(event) => commitPrice('priceMin', event.target.value)}
          onKeyDown={priceKeyHandler}
        />

        <InputField
          key={`priceMax-${filters.priceMax ?? ''}`}
          label="Цена до, ₸"
          type="number"
          inputMode="numeric"
          min={0}
          step={5000}
          placeholder="2 500 000"
          defaultValue={filters.priceMax ?? ''}
          onBlur={(event) => commitPrice('priceMax', event.target.value)}
          onKeyDown={priceKeyHandler}
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
          <Button variant="ghost" size="sm" onClick={onReset}>
            Сбросить всё
          </Button>
        </div>
      ) : null}
    </section>
  )
}
