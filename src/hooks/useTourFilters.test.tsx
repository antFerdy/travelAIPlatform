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
      <p>country: {filters.country ?? '—'}</p>
      <p>priceMin: {filters.priceMin ?? '—'}</p>
      <p>active: {activeCount}</p>

      <button type="button" onClick={() => setFilters({ country: 'Грузия' })}>
        Выбрать Грузию
      </button>
      <button type="button" onClick={() => setFilters({ priceMin: 200000 })}>
        Задать цену
      </button>
      <button type="button" onClick={() => setFilters({ country: undefined })}>
        Снять страну
      </button>
      <button type="button" onClick={resetFilters}>
        Сбросить
      </button>
    </div>
  )
}

describe('parseFilters', () => {
  it('читает все поддерживаемые параметры', () => {
    const params = new URLSearchParams(
      'country=Грузия&priceMin=100000&priceMax=500000&dateFrom=2026-09-01&dateTo=2026-10-01&guests=3&sort=price-asc',
    )

    expect(parseFilters(params)).toEqual({
      country: 'Грузия',
      priceMin: 100000,
      priceMax: 500000,
      dateFrom: '2026-09-01',
      dateTo: '2026-10-01',
      guests: 3,
      sort: 'price-asc',
    })
  })

  it('игнорирует битый параметр, не теряя остальные', () => {
    const filters = parseFilters(new URLSearchParams('country=Грузия&guests=сто&sort=неизвестно'))

    expect(filters.country).toBe('Грузия')
    expect(filters.guests).toBeUndefined()
    expect(filters.sort).toBeUndefined()
  })

  it('пропускает даты в неверном формате', () => {
    expect(parseFilters(new URLSearchParams('dateFrom=01.09.2026')).dateFrom).toBeUndefined()
  })

  it('не считает сортировку активным фильтром', () => {
    expect(parseFilters(new URLSearchParams('sort=price-asc'))).toEqual({ sort: 'price-asc' })
  })
})

describe('useTourFilters', () => {
  it('поднимает фильтры из строки запроса при первом рендере', () => {
    renderWithProviders(<FiltersProbe />, { route: '/tours?country=Турция&priceMin=300000' })

    expect(screen.getByText('country: Турция')).toBeInTheDocument()
    expect(screen.getByText('priceMin: 300000')).toBeInTheDocument()
    expect(screen.getByText('active: 2')).toBeInTheDocument()
  })

  it('записывает выбранный фильтр в строку запроса', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, { route: '/tours' })

    await user.click(screen.getByRole('button', { name: 'Выбрать Грузию' }))

    expect(screen.getByText(/search: \?country=/)).toBeInTheDocument()
    expect(screen.getByText('country: Грузия')).toBeInTheDocument()
  })

  it('сохраняет остальные фильтры при изменении одного', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, { route: '/tours?country=Турция' })

    await user.click(screen.getByRole('button', { name: 'Задать цену' }))

    expect(screen.getByText('country: Турция')).toBeInTheDocument()
    expect(screen.getByText('priceMin: 200000')).toBeInTheDocument()
  })

  it('удаляет параметр из URL, когда фильтр снимают', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, {
      route: '/tours?country=Турция&priceMin=200000',
    })

    await user.click(screen.getByRole('button', { name: 'Снять страну' }))

    expect(screen.getByText('country: —')).toBeInTheDocument()
    expect(screen.getByText('priceMin: 200000')).toBeInTheDocument()
    expect(screen.getByText('active: 1')).toBeInTheDocument()
  })

  it('сбрасывает все фильтры разом', async () => {
    const { user } = renderWithProviders(<FiltersProbe />, {
      route: '/tours?country=Турция&priceMin=200000&sort=price-asc',
    })

    await user.click(screen.getByRole('button', { name: 'Сбросить' }))

    expect(screen.getByText('search: (пусто)')).toBeInTheDocument()
    expect(screen.getByText('active: 0')).toBeInTheDocument()
  })
})
