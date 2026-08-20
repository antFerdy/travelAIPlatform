import type { KeyboardEvent } from 'react'

import type { TourFilters as Filters } from '@/hooks/useTourFilters'
import { todayIso } from '@/lib/format'
import type { Country } from '@/types/tour'

import { Button } from '../ui/Button'
import { InputField, SelectField } from '../ui/Field'

export type TourFiltersProps = {
  filters: Filters
  countries: Country[]
  activeCount: number
  onChange: (patch: Partial<Filters>) => void
  onReset: () => void
}

const toNumber = (value: string): number | undefined => {
  const trimmed = value.trim()

  if (trimmed === '') return undefined

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

export function TourFilters({ filters, countries, activeCount, onChange, onReset }: TourFiltersProps) {
  /**
   * Поля цены неуправляемые и пересоздаются через `key` при смене применённого
   * значения. Так строка запроса остаётся единственным источником истины:
   * зеркалить её в состояние компонента — значит завести вторую копию, которая
   * разойдётся с URL при «назад» или сбросе. Значение уходит в фильтр
   * по Enter или потере фокуса.
   */
  const commitPrice = (key: 'minPrice' | 'maxPrice', value: string) => {
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
          value={filters.countryId?.toString() ?? ''}
          onChange={(event) =>
            onChange({ countryId: event.target.value ? Number(event.target.value) : undefined })
          }
        >
          <option value="">Любая</option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </SelectField>

        <InputField
          key={`minPrice-${filters.minPrice ?? ''}`}
          label="Цена от, ₸"
          type="number"
          inputMode="numeric"
          min={0}
          step={5000}
          placeholder="600 000"
          hint="Enter или переход к другому полю применяет цену"
          defaultValue={filters.minPrice ?? ''}
          onBlur={(event) => commitPrice('minPrice', event.target.value)}
          onKeyDown={priceKeyHandler}
        />

        <InputField
          key={`maxPrice-${filters.maxPrice ?? ''}`}
          label="Цена до, ₸"
          type="number"
          inputMode="numeric"
          min={0}
          step={5000}
          placeholder="950 000"
          defaultValue={filters.maxPrice ?? ''}
          onBlur={(event) => commitPrice('maxPrice', event.target.value)}
          onKeyDown={priceKeyHandler}
        />

        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <InputField
            label="Поездка с"
            type="date"
            min={todayIso()}
            value={filters.dateFrom ?? ''}
            onChange={(event) => onChange({ dateFrom: event.target.value || undefined })}
          />
          <InputField
            label="Поездка по"
            type="date"
            min={filters.dateFrom ?? todayIso()}
            value={filters.dateTo ?? ''}
            onChange={(event) => onChange({ dateTo: event.target.value || undefined })}
          />
        </div>
      </div>

      <p className="text-ink-400 text-xs">
        По датам отбираются туры, которые пересекаются с выбранным периодом, а не только целиком
        в него попадают.
      </p>

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
