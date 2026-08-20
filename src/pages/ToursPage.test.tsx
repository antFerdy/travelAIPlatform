import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, api } from '@/api'
import { makeTour } from '@/test/factories'
import { renderWithProviders } from '@/test/renderWithProviders'

import { ToursPage } from './ToursPage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ToursPage', () => {
  it('показывает каталог и количество найденных туров', async () => {
    renderWithProviders(<ToursPage />, { route: '/tours' })

    await waitFor(() => {
      expect(screen.getByText(/18 туров/)).toBeInTheDocument()
    })

    expect(screen.getAllByRole('article').length).toBeGreaterThan(0)
  })

  it('применяет фильтры из строки запроса к выдаче', async () => {
    renderWithProviders(<ToursPage />, { route: '/tours?country=Грузия' })

    await waitFor(() => {
      expect(screen.getByText(/Активных фильтров: 1/)).toBeInTheDocument()
    })

    const cards = await screen.findAllByRole('article')

    for (const card of cards) {
      expect(within(card).getByText(/^Грузия,/)).toBeInTheDocument()
    }
  })

  it('предлагает сбросить фильтры, когда ничего не найдено', async () => {
    renderWithProviders(<ToursPage />, { route: '/tours?priceMin=99000000' })

    expect(await screen.findByText('Под эти условия туров нет')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument()
  })

  it('показывает ошибку с возможностью повтора, когда каталог не загрузился', async () => {
    vi.spyOn(api, 'listTours').mockRejectedValue(new ApiError(500, 'Сервер недоступен'))

    renderWithProviders(<ToursPage />, { route: '/tours' })

    const alert = await screen.findByRole('alert')

    expect(within(alert).getByText('Сервер недоступен')).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Попробовать снова' })).toBeInTheDocument()
  })

  it('догружает следующую страницу по кнопке «Показать ещё»', async () => {
    const { user } = renderWithProviders(<ToursPage />, { route: '/tours' })

    const loadMore = await screen.findByRole('button', { name: 'Показать ещё' })
    const before = screen.getAllByRole('article').length

    await user.click(loadMore)

    await waitFor(() => {
      expect(screen.getAllByRole('article').length).toBeGreaterThan(before)
    })
  })

  it('прячет кнопку догрузки, когда показаны все туры', async () => {
    vi.spyOn(api, 'listTours').mockResolvedValue({
      items: [makeTour({ title: 'Единственный тур' })],
      total: 1,
      page: 1,
      limit: 9,
    })

    renderWithProviders(<ToursPage />, { route: '/tours' })

    expect(await screen.findByText('Единственный тур')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Показать ещё' })).not.toBeInTheDocument()
  })
})
