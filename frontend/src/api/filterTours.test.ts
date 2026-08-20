import { describe, expect, it } from 'vitest'

import { makeDeparture, makeTour } from '@/test/factories'
import type { Tour } from '@/types/tour'

import { collectCountries, filterTours } from './filterTours'

const catalog: Tour[] = [
  makeTour({
    id: 'cheap-georgia',
    country: 'Грузия',
    pricePerPerson: 180_000,
    rating: 4.1,
    departures: [makeDeparture({ startDate: '2027-03-10', seatsLeft: 10 })],
  }),
  makeTour({
    id: 'mid-turkey',
    country: 'Турция',
    pricePerPerson: 420_000,
    rating: 4.8,
    departures: [makeDeparture({ startDate: '2026-09-12', seatsLeft: 2 })],
  }),
  makeTour({
    id: 'lux-maldives',
    country: 'Мальдивы',
    pricePerPerson: 2_400_000,
    rating: 4.9,
    departures: [makeDeparture({ startDate: '2026-11-05', seatsLeft: 6 })],
  }),
]

const ids = (tours: Tour[]): string[] => tours.map((tour) => tour.id)

describe('filterTours — фильтрация', () => {
  it('без запроса возвращает весь каталог', () => {
    const result = filterTours(catalog, {})

    expect(result.total).toBe(3)
    expect(result.items).toHaveLength(3)
  })

  it('фильтрует по стране', () => {
    expect(ids(filterTours(catalog, { country: 'Турция' }).items)).toEqual(['mid-turkey'])
  })

  it('возвращает пустой результат по неизвестной стране', () => {
    const result = filterTours(catalog, { country: 'Антарктида' })

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })

  it('фильтрует по нижней границе цены включительно', () => {
    expect(ids(filterTours(catalog, { priceMin: 420_000 }).items).sort()).toEqual([
      'lux-maldives',
      'mid-turkey',
    ])
  })

  it('фильтрует по верхней границе цены включительно', () => {
    expect(ids(filterTours(catalog, { priceMax: 420_000 }).items).sort()).toEqual([
      'cheap-georgia',
      'mid-turkey',
    ])
  })

  it('комбинирует несколько условий', () => {
    const result = filterTours(catalog, {
      priceMin: 200_000,
      priceMax: 1_000_000,
      country: 'Турция',
    })

    expect(ids(result.items)).toEqual(['mid-turkey'])
  })

  it('фильтрует по окну дат вылета', () => {
    const result = filterTours(catalog, { dateFrom: '2026-10-01', dateTo: '2026-12-31' })

    expect(ids(result.items)).toEqual(['lux-maldives'])
  })

  it('отсекает туры, где на вылете не хватает мест', () => {
    const result = filterTours(catalog, { guests: 4 })

    expect(ids(result.items).sort()).toEqual(['cheap-georgia', 'lux-maldives'])
  })
})

describe('filterTours — сортировка', () => {
  it('по возрастанию цены', () => {
    expect(ids(filterTours(catalog, { sort: 'price-asc' }).items)).toEqual([
      'cheap-georgia',
      'mid-turkey',
      'lux-maldives',
    ])
  })

  it('по убыванию цены', () => {
    expect(ids(filterTours(catalog, { sort: 'price-desc' }).items)).toEqual([
      'lux-maldives',
      'mid-turkey',
      'cheap-georgia',
    ])
  })

  it('по убыванию рейтинга', () => {
    expect(ids(filterTours(catalog, { sort: 'rating-desc' }).items)).toEqual([
      'lux-maldives',
      'mid-turkey',
      'cheap-georgia',
    ])
  })

  it('по ближайшему вылету — туры без предстоящих вылетов уходят в конец', () => {
    const withPastOnly = makeTour({
      id: 'past-only',
      departures: [makeDeparture({ startDate: '2020-01-01' })],
    })

    const result = filterTours([...catalog, withPastOnly], { sort: 'departure-asc' })

    expect(ids(result.items).at(-1)).toBe('past-only')
  })

  it('не мутирует исходный массив', () => {
    const original = [...catalog]
    filterTours(catalog, { sort: 'price-desc' })

    expect(catalog).toEqual(original)
  })
})

describe('filterTours — пагинация', () => {
  it('режет выдачу по limit, сохраняя полное значение total', () => {
    const result = filterTours(catalog, { limit: 2, sort: 'price-asc' })

    expect(result.items).toHaveLength(2)
    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(2)
  })

  it('отдаёт следующую страницу', () => {
    const result = filterTours(catalog, { limit: 2, page: 2, sort: 'price-asc' })

    expect(ids(result.items)).toEqual(['lux-maldives'])
  })

  it('возвращает пустой список за последней страницей', () => {
    expect(filterTours(catalog, { limit: 2, page: 99 }).items).toEqual([])
  })

  it('поднимает некорректные page и limit до минимума', () => {
    const result = filterTours(catalog, { page: 0, limit: 0 })

    expect(result.page).toBe(1)
    expect(result.limit).toBe(1)
  })
})

describe('collectCountries', () => {
  it('возвращает страны без повторов по алфавиту', () => {
    const tours = [
      makeTour({ country: 'Турция' }),
      makeTour({ country: 'Грузия' }),
      makeTour({ country: 'Турция' }),
    ]

    expect(collectCountries(tours)).toEqual(['Грузия', 'Турция'])
  })

  it('возвращает пустой список для пустого каталога', () => {
    expect(collectCountries([])).toEqual([])
  })
})
