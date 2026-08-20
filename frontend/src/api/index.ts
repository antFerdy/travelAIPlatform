import { httpChatApi } from './adapters/chatHttp'
import { httpApi } from './adapters/http'
import type { Api, ChatApi } from './contract'

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

/**
 * Клиент AI-помощника. Отдельная точка входа: сервис другой, адрес задаётся
 * VITE_AI_API_BASE_URL, и его недоступность не должна ломать каталог.
 */
export const chatApi: ChatApi = httpChatApi

export { ApiError } from './contract'
export { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MAX_CHAT_MESSAGE_LENGTH } from './contract'
export type { ChatRequest, Paginated, TourQuery } from './contract'
