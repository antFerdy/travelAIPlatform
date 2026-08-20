export const MEAL_PLANS = ['RO', 'BB', 'HB', 'FB', 'AI'] as const

export type MealPlan = (typeof MEAL_PLANS)[number]

export const MEAL_PLAN_LABELS: Record<MealPlan, string> = {
  RO: 'Без питания',
  BB: 'Завтраки',
  HB: 'Завтрак и ужин',
  FB: 'Полный пансион',
  AI: 'Всё включено',
}

/** Конкретный вылет по туру. Даты — календарные, в формате YYYY-MM-DD. */
export type Departure = {
  id: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  seatsLeft: number
}

export type Tour = {
  id: string
  title: string
  country: string
  city: string
  description: string
  images: string[]
  /** Целое число тенге за одного гостя за весь тур. */
  pricePerPerson: number
  currency: 'KZT'
  nights: number
  /** 0–5 */
  rating: number
  reviewsCount: number
  /** 1–5 */
  hotelStars: number
  mealPlan: MealPlan
  includes: string[]
  departures: Departure[]
}
