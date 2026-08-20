/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Базовый адрес бэкенда без /api/v1. Обязателен. См. .env.example */
  readonly VITE_API_BASE_URL?: string
  /** Базовый адрес AI-сервиса без /chat. Нужен только чату. См. .env.example */
  readonly VITE_AI_API_BASE_URL?: string
  /** Только для e2e: подменить бэкенд браузерным MSW. */
  readonly VITE_ENABLE_MSW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
