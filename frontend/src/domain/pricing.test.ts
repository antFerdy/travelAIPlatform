import { describe, expect, it } from 'vitest'

import { GROUP_DISCOUNT_RATE, GROUP_DISCOUNT_THRESHOLD, calculateTotal } from './pricing'

describe('calculateTotal', () => {
  it('умножает цену за гостя на число гостей', () => {
    const result = calculateTotal({ pricePerPerson: 400_000, guests: 2 })

    expect(result.base).toBe(800_000)
    expect(result.total).toBe(800_000)
  })

  it('не даёт скидку, пока гостей меньше порога', () => {
    const result = calculateTotal({
      pricePerPerson: 100_000,
      guests: GROUP_DISCOUNT_THRESHOLD - 1,
    })

    expect(result.discount).toBe(0)
    expect(result.discountRate).toBe(0)
  })

  it('применяет групповую скидку начиная с порогового числа гостей', () => {
    const result = calculateTotal({
      pricePerPerson: 100_000,
      guests: GROUP_DISCOUNT_THRESHOLD,
    })

    expect(result.discountRate).toBe(GROUP_DISCOUNT_RATE)
    expect(result.discount).toBe(Math.round(result.base * GROUP_DISCOUNT_RATE))
    expect(result.total).toBe(result.base - result.discount)
  })

  it('возвращает скидку целым числом тенге', () => {
    const result = calculateTotal({ pricePerPerson: 33_333, guests: 3 })

    expect(Number.isInteger(result.discount)).toBe(true)
    expect(Number.isInteger(result.total)).toBe(true)
  })

  it('отвергает дробное и нулевое число гостей', () => {
    expect(() => calculateTotal({ pricePerPerson: 100_000, guests: 0 })).toThrow(RangeError)
    expect(() => calculateTotal({ pricePerPerson: 100_000, guests: 2.5 })).toThrow(RangeError)
  })

  it('отвергает число гостей сверх допустимого максимума', () => {
    expect(() => calculateTotal({ pricePerPerson: 100_000, guests: 11 })).toThrow(RangeError)
  })

  it('отвергает отрицательную и дробную цену', () => {
    expect(() => calculateTotal({ pricePerPerson: -1, guests: 1 })).toThrow(RangeError)
    expect(() => calculateTotal({ pricePerPerson: 100.5, guests: 1 })).toThrow(RangeError)
  })
})
