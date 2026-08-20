import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  /** Начальный маршрут — фильтры и параметры страниц читаются из URL. */
  route?: string
}

export type RenderWithProvidersResult = RenderResult & {
  user: ReturnType<typeof userEvent.setup>
}

/**
 * Рендер с реальными провайдерами роутера и react-query.
 *
 * Повторы запросов отключены: иначе упавший тест ждёт ретраев вместо того,
 * чтобы сразу показать ошибку.
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  const result = render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
    ...options,
  })

  return { ...result, user: userEvent.setup() }
}
