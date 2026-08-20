import { screen } from '@testing-library/react'
import { useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/renderWithProviders'

import { parseFilters, useTourFilters } from './useTourFilters'

function FiltersProbe() {
  const { filters, setFilters, resetFilters, activeCount } = useTourFilters()
  const location = useLocation()

  return (
    <div>
      <p>search: {location.search || '(пусто)'}</p>
      <p>countryId: {filters.countryId ?? '—'}</p>
      <p>minPrice: {filters.minPrice ?? '—'}</p>
      <p>active: {activeCount}</p>

      <button type="button" onClick={() => setFilters({ countryId: 2 })}>
        Выбрать Турцию
      </button>
      <button type="button" onClick={() => setFilters({ minPrice: 700000 })}>
        Задать цену
      </button>
      <button type="button" onClick={() => setFilters({ countryId: undefined })}>
        Снять страну
      </button>
      <button type="button" onClick={resetFilters}>
        Сбросить
      </button>
    </div>
  )
}

describe('parseFilters', () => {
  it('читает все параметры, которые понимает бэкенд', () => {
    const params = new URLSearchParams(
      'countryId=2&minPrice=700000&maxPrice=900000&dateFrom=2026-09-01&dateTo=2026-10-01',
    )

    expect(parseFilters(params)).toEqual({
      countryId: 2,
      minPrice: 700000,
      maxPrice: 900000,
      dateFrom: '2026-09-01',
      dateTo: '2026-10-01',
    })
  })

  it('игнорирует битый параметр, не теряя остальные', () => {
    const filters = parseFilters(new URLSearchParams('countryId=2&minPrice=сто'))

    expect(filters.countryId).toBe(2)
    expect(filters.minPrice).toBeUndefined()
  })

  it('пропускает даты в неверном формате', () => {
    expect(parseFilters(new URLSearchParams('dateFrom=01.09.2026')).dateFrom).toBeUndefined()
  })

  it('не принимает нулевой и отрицательный id страны', () => {
    expect(parseFilters(new URLSearchParams('countryId=0')).countryId).toBeUndefined()
    expect(parseFilters(new URLSearchParams('countryId=-3')).countryId).toBeUndefined()
  })
})

describe('useTourFilters', () => {
  it('поднимает фильтры из строки запроса при первом рендере', () => {
    renderWithProviders(<FiltersProbe />, { route: '/tours?countryId=2&minPrice=700000' })

    expect(screen.getByText('countryId: 2')).toBeInTheDocument()
    expect(screen.getByText('minPrice: 700000')).toBeInTheDocument()
    expect(screen.getByText('active: 2')).toBeInTheDocument()
  })

  it('записывает выбранный фильтр в строку запроса', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, { route: '/tours' })

    await user.click(screen.getByRole('button', { name: 'Выбрать Турцию' }))

    expect(screen.getByText('search: ?countryId=2')).toBeInTheDocument()
    expect(screen.getByText('countryId: 2')).toBeInTheDocument()
  })

  it('сохраняет остальные фильтры при изменении одного', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, { route: '/tours?countryId=2' })

    await user.click(screen.getByRole('button', { name: 'Задать цену' }))

    expect(screen.getByText('countryId: 2')).toBeInTheDocument()
    expect(screen.getByText('minPrice: 700000')).toBeInTheDocument()
  })

  it('удаляет параметр из URL, когда фильтр снимают', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, {
      route: '/tours?countryId=2&minPrice=700000',
    })

    await user.click(screen.getByRole('button', { name: 'Снять страну' }))

    expect(screen.getByText('countryId: —')).toBeInTheDocument()
    expect(screen.getByText('minPrice: 700000')).toBeInTheDocument()
    expect(screen.getByText('active: 1')).toBeInTheDocument()
  })

  it('сбрасывает все фильтры разом', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, {
      route: '/tours?countryId=2&minPrice=700000',
    })

    await user.click(screen.getByRole('button', { name: 'Сбросить' }))

    expect(screen.getByText('search: (пусто)')).toBeInTheDocument()
    expect(screen.getByText('active: 0')).toBeInTheDocument()
  })
})
