import { screen } from '@testing-library/react'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, api } from '@/api'
import { makeDeparture, makeTour } from '@/test/factories'
import { renderWithProviders } from '@/test/renderWithProviders'

import { TourDetailsPage } from './TourDetailsPage'

const TOUR = makeTour({
  id: 'ge-tbilisi-01',
  title: 'Тбилиси: серные бани и Мцхета',
  country: 'Грузия',
  city: 'Тбилиси',
  description: 'Отель в Сололаки, рядом с банями Абанотубани.',
  images: ['https://example.test/1.jpg', 'https://example.test/2.jpg'],
  includes: ['Перелёт', 'Трансфер', 'Экскурсия в Мцхету'],
  departures: [
    makeDeparture({ id: 'dep-01', startDate: '2027-01-15', endDate: '2027-01-19', seatsLeft: 20 }),
    makeDeparture({ id: 'dep-02', startDate: '2027-02-10', endDate: '2027-02-14', seatsLeft: 0 }),
    makeDeparture({ id: 'dep-03', startDate: '2020-01-01', endDate: '2020-01-05', seatsLeft: 9 }),
  ],
})

function LocationProbe() {
  const location = useLocation()

  return <p>переход: {location.pathname + location.search}</p>
}

function renderTourPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/tours/:tourId" element={<TourDetailsPage />} />
      <Route path="/tours/:tourId/book" element={<LocationProbe />} />
    </Routes>,
    { route: '/tours/ge-tbilisi-01' },
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('TourDetailsPage', () => {
  it('показывает описание тура и состав пакета', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    renderTourPage()

    expect(
      await screen.findByRole('heading', { name: 'Тбилиси: серные бани и Мцхета' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Отель в Сололаки/)).toBeInTheDocument()
    expect(screen.getByText('Экскурсия в Мцхету')).toBeInTheDocument()
  })

  it('не предлагает вылеты, которые уже состоялись', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    renderTourPage()

    await screen.findByRole('heading', { name: TOUR.title })

    expect(screen.queryByText(/января 2020/)).not.toBeInTheDocument()
  })

  it('не даёт выбрать вылет без свободных мест', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    renderTourPage()

    const soldOut = await screen.findByRole('button', { name: /мест нет/ })

    expect(soldOut).toBeDisabled()
  })

  it('переносит выбранный вылет в ссылку на бронирование', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    const { user } = renderTourPage()

    await user.click(await screen.findByRole('button', { name: /осталось 20 мест/ }))
    await user.click(screen.getByRole('button', { name: 'Забронировать' }))

    expect(
      await screen.findByText('переход: /tours/ge-tbilisi-01/book?departureId=dep-01'),
    ).toBeInTheDocument()
  })

  it('пропускает на бронирование и без выбранного вылета', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    const { user } = renderTourPage()

    await user.click(await screen.findByRole('button', { name: 'Забронировать' }))

    expect(await screen.findByText('переход: /tours/ge-tbilisi-01/book')).toBeInTheDocument()
  })

  it('переключает главное фото галереи', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    const { user } = renderTourPage()

    await user.click(await screen.findByRole('button', { name: 'Показать фото 2' }))

    expect(screen.getByRole('img', { name: 'Тбилиси, Грузия' })).toHaveAttribute(
      'src',
      'https://example.test/2.jpg',
    )
  })

  it('показывает ошибку, когда тур не найден', async () => {
    vi.spyOn(api, 'getTour').mockRejectedValue(new ApiError(404, 'Тур не найден'))

    renderTourPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Тур не найден')
  })
})
