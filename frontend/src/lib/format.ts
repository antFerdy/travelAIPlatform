import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

const numberFormat = new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 0 })

const CURRENCY_SYMBOLS: Record<string, string> = {
  KZT: '₸',
  USD: '$',
  EUR: '€',
  RUB: '₽',
}

/**
 * Форматирует сумму: `845 000 ₸`.
 *
 * Валюта приходит с каждым туром, поэтому символ подбирается по коду,
 * а незнакомый код показывается как есть — лучше «845 000 GBP», чем
 * молча выдать чужую валюту за тенге.
 *
 * Символ подставляется вручную, а не через `style: 'currency'`: позиция
 * и отступ у KZT разнятся между версиями ICU, а вывод должен совпадать
 * в браузере и в jsdom-тестах.
 */
export function formatPrice(amount: number, currency = 'KZT'): string {
  return `${numberFormat.format(amount)} ${CURRENCY_SYMBOLS[currency] ?? currency}`
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

/** `9` → `9 ночей`. Бэкенд называет это duration_days, но считает ночи. */
export function formatNights(nights: number): string {
  return `${nights} ${plural(nights, ['ночь', 'ночи', 'ночей'])}`
}

/** `2` → `2 человека` */
export function formatPeople(people: number): string {
  return `${people} ${plural(people, ['человек', 'человека', 'человек'])}`
}

/** Сегодняшняя дата в формате YYYY-MM-DD по локальному календарю. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${now.getFullYear()}-${month}-${day}`
}
