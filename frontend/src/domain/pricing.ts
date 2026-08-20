import { MAX_GUESTS, MIN_GUESTS } from '@/types/booking'

/** Начиная с этого числа гостей действует групповая скидка. */
export const GROUP_DISCOUNT_THRESHOLD = 3

/** Размер групповой скидки. */
export const GROUP_DISCOUNT_RATE = 0.05

export type PriceInput = {
  /** Целое число тенге за одного гостя. */
  pricePerPerson: number
  guests: number
}

export type PriceBreakdown = {
  /** Стоимость до скидки. */
  base: number
  /** Абсолютный размер скидки, целое число тенге. */
  discount: number
  /** Применённая ставка скидки: 0 или GROUP_DISCOUNT_RATE. */
  discountRate: number
  /** Итог к оплате менеджеру, целое число тенге. */
  total: number
}

/**
 * Считает стоимость брони.
 *
 * Правило одно: от GROUP_DISCOUNT_THRESHOLD гостей — скидка GROUP_DISCOUNT_RATE
 * на всю сумму. Скидка округляется до целого тенге, дробных сумм в продукте нет.
 */
export function calculateTotal({ pricePerPerson, guests }: PriceInput): PriceBreakdown {
  if (!Number.isInteger(pricePerPerson) || pricePerPerson < 0) {
    throw new RangeError('pricePerPerson должен быть неотрицательным целым числом')
  }

  if (!Number.isInteger(guests) || guests < MIN_GUESTS || guests > MAX_GUESTS) {
    throw new RangeError(`guests должен быть целым числом от ${MIN_GUESTS} до ${MAX_GUESTS}`)
  }

  const base = pricePerPerson * guests
  const discountRate = guests >= GROUP_DISCOUNT_THRESHOLD ? GROUP_DISCOUNT_RATE : 0
  const discount = Math.round(base * discountRate)

  return { base, discount, discountRate, total: base - discount }
}
