import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import './index.css'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Не найден корневой элемент #root')
}

/**
 * В e2e бэкенд подменяется браузерным MSW. Проверка идёт по литералу,
 * который Vite подставляет на этапе сборки, поэтому в обычной сборке
 * ветка вырезается вместе с импортом заглушек.
 */
async function bootstrap(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW === 'true') {
    try {
      const { startBrowserMocks } = await import('./test/browserMocks')
      await startBrowserMocks()
    } catch (cause) {
      // Service worker может не зарегистрироваться (например, в песочнице).
      // Приложение должно отрисоваться и честно показать ошибку сети,
      // а не остаться белым экраном.
      console.error('Не удалось поднять заглушку бэкенда:', cause)
    }
  }

  createRoot(container as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
