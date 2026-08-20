import { setupServer } from 'msw/node'

import { handlers } from './handlers'

/** Заглушка бэкенда для юнит- и компонентных тестов (окружение Node). */
export const mswServer = setupServer(...handlers)

export { AI_ORIGIN, API_ORIGIN, resetBackendState } from './handlers'
