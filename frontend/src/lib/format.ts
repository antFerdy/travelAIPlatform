import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const numberFormat = new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 0 })

/**
 * Форматирует сумму в тенге: `420 000 ₸`.
 *
 * Символ подставляется вручную, а не через `style: 'currency'`, потому что
 * позиция и отступ у KZT разнятся между версиями ICU — а вывод должен быть
 * одинаковым и в браузере, и в jsdom-тестах.
 * Разделитель разрядов — неразрывный пробел, как того требует русская типографика.
 */
export function formatPrice(amount: number): string {
  return `${numberFormat.format(amount)} ₸`
}

/** `2026-09-12` → `12 сентября 2026` */
export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMMM yyyy', { locale: ru })
}

/** `2026-09-12` → `12 сен` */
export function formatDateShort(isoDate: string): string {
  return format(parseISO(isoDate), 'd MMM', { locale: ru })
}

/** `12 сен — 19 сентября 2026` */
export function formatDateRange(startIso: string, endIso: string): string {
  return `${formatDateShort(startIso)} — ${formatDate(endIso)}`
}

/**
 * Русское склонение по числу.
 *
 * @param forms `[одна ночь, две ночи, пять ночей]`
 */
export function plural(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100
  const last = abs % 10

  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]

  return forms[2]
}

/** `7` → `7 ночей` */
export function formatNights(nights: number): string {
  return `${nights} ${plural(nights, ['ночь', 'ночи', 'ночей'])}`
}

/** `2` → `2 гостя` */
export function formatGuests(guests: number): string {
  return `${guests} ${plural(guests, ['гость', 'гостя', 'гостей'])}`
}

/** `8` → `осталось 8 мест` */
export function formatSeatsLeft(seats: number): string {
  return `осталось ${seats} ${plural(seats, ['место', 'места', 'мест'])}`
}
