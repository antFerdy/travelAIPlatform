/**
 * Форма тура повторяет ответ бэкенда из docs/superpowers/specs/api.md,
 * но в camelCase: snake_case остаётся за границей слоя данных и в компоненты
 * не протекает. Преобразование делают zod-схемы в src/api/schemas.ts.
 */
export type Tour = {
  id: number
  title: string
  description: string
  /** FK на Country.id — название страны приходит отдельным запросом. */
  countryId: number
  /** Число с двумя знаками. Бэкенд не уточняет, за человека это или за тур. */
  price: number
  /** Код валюты, например KZT. */
  currency: string
  /** YYYY-MM-DD */
  startDate: string
  /** YYYY-MM-DD */
  endDate: string
  durationDays: number
  /** Открытое множество: бэкенд перечисляет beach и city как примеры. */
  category?: string
  imageUrl?: string
  /** RFC 3339 */
  createdAt: string
}

export type Country = {
  id: number
  name: string
  code: string
}

const CATEGORY_LABELS: Record<string, string> = {
  beach: 'Пляжный',
  city: 'Городской',
  ski: 'Горнолыжный',
  excursion: 'Экскурсионный',
}

/**
 * Подпись категории. Список категорий у бэкенда открытый, поэтому незнакомое
 * значение показываем как есть, а не прячем.
 */
export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category
}
