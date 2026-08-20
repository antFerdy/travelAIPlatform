import { screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { api } from '@/api'
import { TOURS, makeBookingDraft } from '@/test/fixtures'
import { API_ORIGIN, mswServer } from '@/test/mswServer'
import { renderWithProviders } from '@/test/renderWithProviders'
import type { Booking } from '@/types/booking'

import { BookingSuccessPage } from './BookingSuccessPage'

const TOUR = TOURS[0]!

function renderSuccessPage(bookingId: number | string) {
  return renderWithProviders(
    <Routes>
      <Route path="/bookings/:bookingId" element={<BookingSuccessPage />} />
    </Routes>,
    { route: `/bookings/${bookingId}` },
  )
}

describe('BookingSuccessPage', () => {
  let booking: Booking

  beforeEach(async () => {
    booking = await api.createBooking(makeBookingDraft({ tourId: TOUR.id, numPeople: 3 }))
  })

  it('показывает номер брони и её состав', async () => {
    renderSuccessPage(booking.id)

    expect(await screen.findByRole('heading', { name: 'Бронь принята' })).toBeInTheDocument()
    expect(screen.getByText(`№${booking.id}`)).toBeInTheDocument()
    expect(screen.getByText('3 человека')).toBeInTheDocument()
    expect(screen.getByText('Айгерим Сериковна')).toBeInTheDocument()

    // Тур подгружается вторым запросом, после самой брони
    expect(await screen.findByText(TOUR.title)).toBeInTheDocument()
    expect(screen.getByText('ОАЭ')).toBeInTheDocument()
  })

  it('переводит статус брони на русский', async () => {
    renderSuccessPage(booking.id)

    expect(await screen.findByText('Ожидает подтверждения менеджера')).toBeInTheDocument()
  })

  it('явно сообщает, что оплата не требуется и сумму назовёт менеджер', async () => {
    renderSuccessPage(booking.id)

    expect(await screen.findByText(/Оплата не требуется/)).toBeInTheDocument()
    // Сервер бронирования суммы не возвращает — обещать итог мы не вправе
    expect(screen.getByText(/назовёт итоговую сумму на 3 человека/)).toBeInTheDocument()
  })

  it('показывает стоимость тура, а не выдуманный итог по числу человек', async () => {
    renderSuccessPage(booking.id)

    expect(await screen.findByText('Стоимость тура')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(String(TOUR.price).slice(0, 3)))).toBeInTheDocument()
  })

  it('не падает, если тур больше не отдаётся', async () => {
    mswServer.use(
      http.get(`${API_ORIGIN}/api/v1/tours/:id`, () =>
        HttpResponse.json({ error: 'tour not found' }, { status: 404 }),
      ),
    )

    renderSuccessPage(booking.id)

    // Номер брони важнее названия тура: пользователь должен получить его в любом случае
    expect(await screen.findByText(`№${booking.id}`)).toBeInTheDocument()
  })

  it('сообщает, что бронь не найдена', async () => {
    renderSuccessPage(4242)

    expect(await screen.findByRole('heading', { name: 'Бронь не найдена' })).toBeInTheDocument()
  })

  it('сообщает о некорректном номере в адресе', async () => {
    renderSuccessPage('не-число')

    expect(await screen.findByRole('heading', { name: 'Бронь не найдена' })).toBeInTheDocument()
  })
})
