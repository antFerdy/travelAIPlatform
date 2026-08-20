import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { AI_ORIGIN, API_ORIGIN, mswServer, resetBackendState } from './mswServer'

/**
 * Все тесты идут против заглушки бэкенда: мок-адаптера у приложения нет,
 * данные всегда приходят по HTTP. onUnhandledRequest: 'error' ловит запросы
 * к ручкам, которых нет в контракте.
 */
beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', API_ORIGIN)
  vi.stubEnv('VITE_AI_API_BASE_URL', AI_ORIGIN)
  mswServer.listen({ onUnhandledRequest: 'error' })
})

beforeEach(() => {
  localStorage.clear()
  resetBackendState()
})

afterEach(() => {
  cleanup()
  mswServer.resetHandlers()
})

afterAll(() => {
  mswServer.close()
  vi.unstubAllEnvs()
})
