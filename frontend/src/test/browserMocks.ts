import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

/**
 * Заглушка бэкенда для e2e в настоящем браузере.
 *
 * Нужна потому, что мок-адаптера у приложения больше нет: фронтенд всегда
 * ходит по HTTP. Чтобы сквозные сценарии не требовали поднятого Go-сервера
 * с базой, запросы перехватывает service worker.
 *
 * Включается только через VITE_ENABLE_MSW — в обычной сборке импорт
 * этого модуля не попадает в бандл.
 */
export async function startBrowserMocks(): Promise<void> {
  const worker = setupWorker(...handlers)

  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}
