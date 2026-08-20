/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Какая реализация слоя данных подставляется в `api`. См. .env.example */
  readonly VITE_API_MODE?: 'mock' | 'http'
  /** База для HTTP-адаптера. Обязательна при VITE_API_MODE=http. */
  readonly VITE_API_BASE_URL?: string
  /** Искусственная задержка мок-адаптера в миллисекундах. */
  readonly VITE_MOCK_LATENCY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
