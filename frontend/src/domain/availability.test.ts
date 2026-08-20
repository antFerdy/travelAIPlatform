import { describe, expect, it } from 'vitest'

import { makeDeparture, makeTour } from '@/test/factories'

import {
  hasMatchingDeparture,
  hasSeats,
  matchesDateWindow,
  nearestDeparture,
  todayIso,
  upcomingDepartures,
} from './availability'

describe('matchesDateWindow', () => {
  const departure = makeDeparture({ startDate: '2026-09-12', endDate: '2026-09-19' })

  it('пропускает вылет, когда окно не задано', () => {
    expect(matchesDateWindow(departure, {})).toBe(true)
  })

  it('отсекает вылет раньше начала окна', () => {
    expect(matchesDateWindow(departure, { dateFrom: '2026-09-13' })).toBe(false)
  })

  it('отсекает вылет позже конца окна', () => {
    expect(matchesDateWindow(departure, { dateTo: '2026-09-11' })).toBe(false)
  })

  it('включает границы окна', () => {
    expect(matchesDateWindow(departure, { dateFrom: '2026-09-12', dateTo: '2026-09-12' })).toBe(true)
  })

  it('смотрит на дату вылета, а не на дату возвращения', () => {
    // Тур заканчивается за пределами окна — это не повод его прятать.
    expect(matchesDateWindow(departure, { dateFrom: '2026-09-01', dateTo: '2026-09-15' })).toBe(true)
  })
})

describe('hasSeats', () => {
  it('пропускает вылет, когда мест ровно столько же, сколько гостей', () => {
    expect(hasSeats(makeDeparture({ seatsLeft: 2 }), 2)).toBe(true)
  })

  it('отсекает вылет, когда мест не хватает', () => {
    expect(hasSeats(makeDeparture({ seatsLeft: 1 }), 2)).toBe(false)
  })
})

describe('upcomingDepartures', () => {
  it('убирает прошедшие вылеты и сортирует остальные по возрастанию даты', () => {
    const tour = makeTour({
      departures: [
        makeDeparture({ startDate: '2026-12-01' }),
        makeDeparture({ startDate: '2026-07-01' }),
        makeDeparture({ startDate: '2026-10-05' }),
      ],
    })

    const result = upcomingDepartures(tour, '2026-08-20')

    expect(result.map((departure) => departure.startDate)).toEqual(['2026-10-05', '2026-12-01'])
  })

  it('считает сегодняшний вылет предстоящим', () => {
    const tour = makeTour({ departures: [makeDeparture({ startDate: '2026-08-20' })] })

    expect(upcomingDepartures(tour, '2026-08-20')).toHaveLength(1)
  })
})

describe('nearestDeparture', () => {
  it('возвращает самый ранний из предстоящих вылетов', () => {
    const tour = makeTour({
      departures: [
        makeDeparture({ startDate: '2026-11-01' }),
        makeDeparture({ startDate: '2026-09-15' }),
      ],
    })

    expect(nearestDeparture(tour, '2026-08-20')?.startDate).toBe('2026-09-15')
  })

  it('возвращает undefined, когда предстоящих вылетов нет', () => {
    const tour = makeTour({ departures: [makeDeparture({ startDate: '2026-01-01' })] })

    expect(nearestDeparture(tour, '2026-08-20')).toBeUndefined()
  })
})

describe('hasMatchingDeparture', () => {
  const tour = makeTour({
    departures: [
      makeDeparture({ startDate: '2026-09-12', seatsLeft: 1 }),
      makeDeparture({ startDate: '2026-11-20', seatsLeft: 8 }),
    ],
  })

  it('находит вылет, подходящий и по окну, и по числу мест', () => {
    expect(hasMatchingDeparture(tour, { dateFrom: '2026-11-01' }, 4)).toBe(true)
  })

  it('не считает подходящим вылет, где не хватает мест', () => {
    expect(hasMatchingDeparture(tour, { dateFrom: '2026-09-01', dateTo: '2026-09-30' }, 4)).toBe(
      false,
    )
  })

  it('игнорирует число мест, когда гости не указаны', () => {
    expect(hasMatchingDeparture(tour, { dateFrom: '2026-09-01', dateTo: '2026-09-30' })).toBe(true)
  })
})

describe('todayIso', () => {
  it('возвращает дату в формате YYYY-MM-DD', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
