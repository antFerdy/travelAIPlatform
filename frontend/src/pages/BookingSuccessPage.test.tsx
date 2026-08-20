import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, api } from '@/api'
import { makeBooking, makeDeparture, makeTour } from '@/test/factories'
import { renderWithProviders } from '@/test/renderWithProviders'

import { BookingSuccessPage } from './BookingSuccessPage'

const TOUR = makeTour({
  id: 'ge-tbilisi-01',
  title: 'Тбилиси: серные бани и Мцхета',
  country: 'Грузия',
  city: 'Тбилиси',
  departures: [
    makeDeparture({ id: 'dep-01', startDate: '2027-01-15', endDate: '2027-01-19', seatsLeft: 20 }),
  ],
})

const BOOKING = makeBooking({
  id: 'BK-8BED25',
  tourId: TOUR.id,
  departureId: 'dep-01',
  guests: 3,
  total: 527_250,
  customer: { name: 'Айгерим Сериковна', email: 'aigerim@example.kz', phone: '+7 701 000 00 00' },
})

function renderSuccessPage(route = '/bookings/BK-8BED25') {
  return renderWithProviders(
    <Routes>
      <Route path="/bookings/:bookingId" element={<BookingSuccessPage />} />
    </Routes>,
    { route },
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BookingSuccessPage', () => {
  it('показывает номер брони и её состав', async () => {
    vi.spyOn(api, 'getBooking').mockResolvedValue(BOOKING)
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    renderSuccessPage()

    expect(await screen.findByRole('heading', { name: 'Бронь принята' })).toBeInTheDocument()
    expect(screen.getByText('BK-8BED25')).toBeInTheDocument()

    // Тур подгружается вторым запросом, после самой брони.
    expect(await screen.findByText('Тбилиси: серные бани и Мцхета')).toBeInTheDocument()
    expect(screen.getByText('Грузия, Тбилиси')).toBeInTheDocument()
    expect(screen.getByText('3 гостя')).toBeInTheDocument()
    expect(screen.getByText(/527\D?250\s?₸/)).toBeInTheDocument()
  })

  it('явно сообщает, что оплата не требуется', async () => {
    vi.spyOn(api, 'getBooking').mockResolvedValue(BOOKING)
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    renderSuccessPage()

    expect(await screen.findByText(/Оплата не требуется/)).toBeInTheDocument()
    expect(screen.getByText('Ожидает подтверждения менеджера')).toBeInTheDocument()
  })

  it('показывает даты выбранного вылета', async () => {
    vi.spyOn(api, 'getBooking').mockResolvedValue(BOOKING)
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    renderSuccessPage()

    expect(await screen.findByText(/19 января 2027/)).toBeInTheDocument()
  })

  it('не падает, пока тур ещё не догрузился', async () => {
    vi.spyOn(api, 'getBooking').mockResolvedValue(BOOKING)
    vi.spyOn(api, 'getTour').mockRejectedValue(new ApiError(404, 'Тур снят с продажи'))

    renderSuccessPage()

    // Номер брони важнее названия тура: пользователь должен получить его в любом случае.
    expect(await screen.findByText('BK-8BED25')).toBeInTheDocument()
  })

  it('сообщает, что бронь не найдена', async () => {
    vi.spyOn(api, 'getBooking').mockRejectedValue(new ApiError(404, 'Бронь BK-000000 не найдена'))

    renderSuccessPage('/bookings/BK-000000')

    expect(await screen.findByRole('heading', { name: 'Бронь не найдена' })).toBeInTheDocument()
  })
})
