import { httpApi } from './adapters/http'
import type { Api } from './contract'

/**
 * Единственная точка входа в слой данных.
 *
 * Реализация одна — HTTP-клиент реального бэкенда. Косвенность оставлена
 * намеренно: она держит правило «компоненты не знают, откуда данные»
 * и позволяет подменить реализацию, не трогая ни одного экрана.
 *
 * Адрес сервера задаётся VITE_API_BASE_URL, см. .env.example.
 */
export const api: Api = httpApi

export { ApiError } from './contract'
export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './contract'
export type { Paginated, TourQuery } from './contract'
