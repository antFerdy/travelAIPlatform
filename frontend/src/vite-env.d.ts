/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый адрес бэкенда без /api/v1. Обязателен. См. .env.example */
  readonly VITE_API_BASE_URL?: string
  /** Только для e2e: подменить бэкенд браузерным MSW. */
  readonly VITE_ENABLE_MSW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
