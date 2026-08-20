import { httpApi } from './adapters/http'
import { mockApi } from './adapters/mock'
import type { Api } from './contract'

/**
 * Единственная точка выбора реализации слоя данных.
 *
 * Переключение на реальный backend — правка .env, а не кода:
 *   VITE_API_MODE=http
 *   VITE_API_BASE_URL=https://…
 *
 * Компоненты и хуки импортируют только `api`. Прямой импорт адаптера
 * запрещён правилом eslint `no-restricted-imports`.
 */
export const api: Api = import.meta.env.VITE_API_MODE === 'http' ? httpApi : mockApi

export { ApiError } from './contract'
export type { Paginated, SortOption, TourQuery } from './contract'
export { DEFAULT_PAGE_SIZE, DEFAULT_SORT, SORT_LABELS, SORT_OPTIONS } from './contract'
