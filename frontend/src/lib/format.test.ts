import { describe, expect, it } from 'vitest'

import {
  formatDate,
  formatDateRange,
  formatDateShort,
  formatNights,
  formatPeople,
  formatPrice,
  plural,
  todayIso,
} from './format'

/**
 * Intl разделяет разряды неразрывным пробелом (U+00A0). В исходнике он записан через
 * fromCharCode, а не литералом: невидимый символ в коде — ловушка при правках.
 */
const NBSP = String.fromCharCode(160)
const normalize = (value: string): string => value.split(NBSP).join(' ')

describe('formatPrice', () => {
  it('разделяет разряды и добавляет символ тенге', () => {
    expect(normalize(formatPrice(420_000))).toBe('420 000 ₸')
  })

  it('не показывает дробную часть', () => {
    expect(normalize(formatPrice(1_250_000))).toBe('1 250 000 ₸')
  })

  it('обрабатывает ноль', () => {
    expect(normalize(formatPrice(0))).toBe('0 ₸')
  })

  it('подставляет символ по коду валюты из тура', () => {
    expect(normalize(formatPrice(1000, 'USD'))).toBe('1 000 $')
  })

  it('показывает незнакомый код как есть, а не выдаёт его за тенге', () => {
    expect(normalize(formatPrice(1000, 'GBP'))).toBe('1 000 GBP')
  })
})

describe('formatDate', () => {
  it('выводит дату по-русски с полным названием месяца', () => {
    expect(formatDate('2026-09-12')).toBe('12 сентября 2026')
  })

  it('не сдвигает день из-за часового пояса', () => {
    expect(formatDate('2026-01-01')).toBe('1 января 2026')
    expect(formatDate('2026-12-31')).toBe('31 декабря 2026')
  })
})

describe('formatDateShort', () => {
  it('сокращает название месяца', () => {
    expect(formatDateShort('2026-09-12')).toContain('12')
    expect(formatDateShort('2026-09-12')).toContain('сен')
  })
})

describe('formatDateRange', () => {
  it('соединяет начало и конец тура', () => {
    const result = formatDateRange('2026-09-12', '2026-09-19')

    expect(result).toContain('12')
    expect(result).toContain('19 сентября 2026')
  })
})

describe('plural', () => {
  const forms: [string, string, string] = ['ночь', 'ночи', 'ночей']

  it('выбирает первую форму для чисел, оканчивающихся на 1', () => {
    expect(plural(1, forms)).toBe('ночь')
    expect(plural(21, forms)).toBe('ночь')
  })

  it('выбирает вторую форму для чисел, оканчивающихся на 2–4', () => {
    expect(plural(2, forms)).toBe('ночи')
    expect(plural(34, forms)).toBe('ночи')
  })

  it('выбирает третью форму для чисел, оканчивающихся на 5–9 и 0', () => {
    expect(plural(5, forms)).toBe('ночей')
    expect(plural(20, forms)).toBe('ночей')
  })

  it('выбирает третью форму для второго десятка', () => {
    expect(plural(11, forms)).toBe('ночей')
    expect(plural(14, forms)).toBe('ночей')
  })
})

describe('склонения в интерфейсе', () => {
  it('склоняет ночи', () => {
    expect(formatNights(7)).toBe('7 ночей')
    expect(formatNights(3)).toBe('3 ночи')
  })

  it('склоняет людей', () => {
    expect(formatPeople(1)).toBe('1 человек')
    expect(formatPeople(2)).toBe('2 человека')
    expect(formatPeople(5)).toBe('5 человек')
  })
})

describe('todayIso', () => {
  it('возвращает дату в формате YYYY-MM-DD', () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
