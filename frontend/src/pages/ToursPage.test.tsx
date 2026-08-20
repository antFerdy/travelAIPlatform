import { screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { COUNTRIES, TOURS } from '@/test/fixtures'
import { API_ORIGIN, mswServer } from '@/test/mswServer'
import { renderWithProviders } from '@/test/renderWithProviders'

import { ToursPage } from './ToursPage'

describe('ToursPage', () => {
  it('показывает каталог и общее число найденных туров', async () => {
    renderWithProviders(<ToursPage />, { route: '/tours' })

    expect(await screen.findByText(new RegExp(`^${TOURS.length} тур`))).toBeInTheDocument()
    expect(screen.getAllByRole('article').length).toBeGreaterThan(0)
  })

  it('подставляет название страны из справочника', async () => {
    renderWithProviders(<ToursPage />, { route: '/tours' })

    await screen.findAllByRole('article')

    await waitFor(() => {
      expect(screen.getAllByText(COUNTRIES[1]!.name).length).toBeGreaterThan(0)
    })
  })

  it('применяет фильтр страны из строки запроса', async () => {
    renderWithProviders(<ToursPage />, { route: '/tours?countryId=1' })

    await waitFor(() => {
      expect(screen.getByText('Активных фильтров: 1')).toBeInTheDocument()
    })

    const expected = TOURS.filter((tour) => tour.countryId === 1).length

    expect(await screen.findByText(new RegExp(`^${expected} тур`))).toBeInTheDocument()
  })

  it('применяет цену, когда поле теряет фокус', async () => {
    const { user } = renderWithProviders(<ToursPage />, { route: '/tours' })

    await screen.findAllByRole('article')

    await user.type(screen.getByLabelText('Цена от, ₸'), '800000')

    // Пока фокус в поле, фильтр не применяется — URL не переписывается на каждую цифру
    expect(screen.queryByText(/Активных фильтров/)).not.toBeInTheDocument()

    await user.tab()

    expect(await screen.findByText('Активных фильтров: 1')).toBeInTheDocument()
  })

  it('очищает поля цены вместе со сбросом фильтров', async () => {
    const { user } = renderWithProviders(<ToursPage />, { route: '/tours?minPrice=99000000' })

    expect(await screen.findByLabelText('Цена от, ₸')).toHaveValue(99000000)

    await user.click(await screen.findByRole('button', { name: 'Сбросить фильтры' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Цена от, ₸')).toHaveValue(null)
    })
  })

  it('предлагает сбросить фильтры, когда ничего не найдено', async () => {
    renderWithProviders(<ToursPage />, { route: '/tours?minPrice=99000000' })

    expect(await screen.findByText('Под эти условия туров нет')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сбросить фильтры' })).toBeInTheDocument()
  })

  it('показывает ошибку с возможностью повтора, когда бэкенд упал', async () => {
    mswServer.use(
      http.get(`${API_ORIGIN}/api/v1/tours`, () =>
        HttpResponse.json({ error: 'database is down' }, { status: 500 }),
      ),
    )

    renderWithProviders(<ToursPage />, { route: '/tours' })

    const alert = await screen.findByRole('alert')

    // Технический текст 500-й прячем за понятным сообщением
    expect(within(alert).getByText(/Сервер вернул ошибку/)).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Попробовать снова' })).toBeInTheDocument()
  })

  it('догружает следующую страницу по кнопке «Показать ещё»', async () => {
    mswServer.use(
      http.get(`${API_ORIGIN}/api/v1/tours`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1')
        const limit = 4
        const offset = (page - 1) * limit

        return HttpResponse.json({
          items: TOURS.slice(offset, offset + limit).map((tour) => ({
            id: tour.id,
            title: tour.title,
            description: tour.description,
            country_id: tour.countryId,
            price: tour.price,
            currency: tour.currency,
            start_date: tour.startDate,
            end_date: tour.endDate,
            duration_days: tour.durationDays,
            created_at: tour.createdAt,
          })),
          page,
          limit,
          total: TOURS.length,
        })
      }),
    )

    const { user } = renderWithProviders(<ToursPage />, { route: '/tours' })

    const loadMore = await screen.findByRole('button', { name: 'Показать ещё' })
    const before = screen.getAllByRole('article').length

    await user.click(loadMore)

    await waitFor(() => {
      expect(screen.getAllByRole('article').length).toBeGreaterThan(before)
    })
  })

  it('прячет кнопку догрузки, когда показаны все туры', async () => {
    // Фильтр сужает выдачу до одной страницы
    renderWithProviders(<ToursPage />, { route: '/tours?countryId=1' })

    await screen.findAllByRole('article')

    expect(screen.queryByRole('button', { name: 'Показать ещё' })).not.toBeInTheDocument()
  })
})
