import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'

import { TOURS } from '@/test/fixtures'
import { API_ORIGIN, mswServer } from '@/test/mswServer'
import { renderWithProviders } from '@/test/renderWithProviders'

import { TourDetailsPage } from './TourDetailsPage'

const TOUR = TOURS[0]!

function renderTourPage(route = `/tours/${TOUR.id}`) {
  return renderWithProviders(
    <Routes>
      <Route path="/tours/:tourId" element={<TourDetailsPage />} />
    </Routes>,
    { route },
  )
}

describe('TourDetailsPage', () => {
  it('показывает название, описание и длительность тура', async () => {
    renderTourPage()

    expect(await screen.findByRole('heading', { name: TOUR.title })).toBeInTheDocument()
    expect(screen.getByText(TOUR.description)).toBeInTheDocument()
    expect(screen.getAllByText(`${TOUR.durationDays} ночей`).length).toBeGreaterThan(0)
  })

  it('показывает даты поездки, заданные туром', async () => {
    renderTourPage()

    await screen.findByRole('heading', { name: TOUR.title })

    expect(screen.getByText('Начало')).toBeInTheDocument()
    expect(screen.getByText('Окончание')).toBeInTheDocument()
  })

  it('подставляет название страны из справочника', async () => {
    renderTourPage()

    expect(await screen.findAllByText('ОАЭ')).not.toHaveLength(0)
  })

  it('ведёт на форму бронирования', async () => {
    renderTourPage()

    const link = await screen.findByRole('link', { name: 'Забронировать' })

    expect(link).toHaveAttribute('href', `/tours/${TOUR.id}/book`)
  })

  it('показывает ошибку, когда тур не найден', async () => {
    renderTourPage('/tours/9999')

    expect(await screen.findByRole('alert')).toHaveTextContent('Не найдено')
  })

  it('сообщает о некорректном адресе вместо вечной загрузки', async () => {
    renderTourPage('/tours/не-число')

    expect(await screen.findByRole('alert')).toHaveTextContent('Тур не найден')
  })

  it('сообщает, что сервер недоступен, вместо технической ошибки fetch', async () => {
    mswServer.use(http.get(`${API_ORIGIN}/api/v1/tours/:id`, () => HttpResponse.error()))

    renderTourPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/Сервер недоступен/)
  })
})
