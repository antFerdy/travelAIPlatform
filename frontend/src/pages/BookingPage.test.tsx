import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiError, api } from '@/api'
import { makeBooking, makeDeparture, makeTour } from '@/test/factories'
import { renderWithProviders } from '@/test/renderWithProviders'

import { BookingPage } from './BookingPage'

const TOUR = makeTour({
  id: 'ge-tbilisi-01',
  title: 'Тбилиси: серные бани',
  pricePerPerson: 200_000,
  departures: [
    makeDeparture({ id: 'dep-01', startDate: '2027-01-15', endDate: '2027-01-19', seatsLeft: 20 }),
    makeDeparture({ id: 'dep-02', startDate: '2027-02-10', endDate: '2027-02-14', seatsLeft: 2 }),
  ],
})

function renderBookingPage(route = '/tours/ge-tbilisi-01/book') {
  return renderWithProviders(
    <Routes>
      <Route path="/tours/:tourId/book" element={<BookingPage />} />
      <Route path="/bookings/:bookingId" element={<p>Бронь оформлена</p>} />
    </Routes>,
    { route },
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BookingPage', () => {
  it('не отправляет пустую форму и объясняет, что не так', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)
    const createBooking = vi.spyOn(api, 'createBooking')

    const { user } = renderBookingPage()

    await user.click(await screen.findByRole('button', { name: 'Забронировать без оплаты' }))

    expect(await screen.findByText('Укажите имя и фамилию')).toBeInTheDocument()
    expect(screen.getByText(/Проверьте адрес/)).toBeInTheDocument()
    expect(screen.getByText(/Телефон в формате/)).toBeInTheDocument()
    expect(screen.getByText('Выберите дату вылета')).toBeInTheDocument()
    expect(createBooking).not.toHaveBeenCalled()
  })

  it('пересчитывает сумму при изменении числа гостей', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    const { user } = renderBookingPage()

    await screen.findByRole('heading', { name: 'Бронирование' })

    // 200 000 × 2 = 400 000, скидки ещё нет
    expect(screen.getByLabelText('Итого к оплате')).toHaveTextContent(/400\D?000\s?₸/)
    expect(screen.queryByText(/Скидка за группу/)).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Гостей'), '3')

    // 200 000 × 3 = 600 000, минус 5% → 570 000
    await waitFor(() => {
      expect(screen.getByText(/Скидка за группу/)).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Итого к оплате')).toHaveTextContent(/570\D?000\s?₸/)
  })

  it('подставляет вылет, выбранный на странице тура', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    renderBookingPage('/tours/ge-tbilisi-01/book?departureId=dep-02')

    await waitFor(() => {
      expect(screen.getByLabelText('Дата вылета')).toHaveValue('dep-02')
    })
  })

  it('снимает вылет из ссылки, если такого вылета у тура нет', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)
    const createBooking = vi.spyOn(api, 'createBooking')

    const { user } = renderBookingPage('/tours/ge-tbilisi-01/book?departureId=dep-999')

    // Значение из строки запроса не должно пережить загрузку тура
    await waitFor(() => {
      expect(screen.getByLabelText('Дата вылета')).toHaveValue('')
    })

    await user.click(screen.getByRole('button', { name: 'Забронировать без оплаты' }))

    expect(await screen.findByText('Выберите дату вылета')).toBeInTheDocument()
    expect(createBooking).not.toHaveBeenCalled()
  })

  it('снимает вылет из ссылки, если он уже состоялся', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(
      makeTour({
        id: 'ge-tbilisi-01',
        departures: [
          makeDeparture({ id: 'dep-past', startDate: '2020-01-01', endDate: '2020-01-05' }),
          makeDeparture({ id: 'dep-01', startDate: '2027-01-15', endDate: '2027-01-19' }),
        ],
      }),
    )

    renderBookingPage('/tours/ge-tbilisi-01/book?departureId=dep-past')

    await waitFor(() => {
      expect(screen.getByLabelText('Дата вылета')).toHaveValue('')
    })
  })

  it('создаёт бронь и уводит на подтверждение', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)
    const createBooking = vi
      .spyOn(api, 'createBooking')
      .mockResolvedValue(makeBooking({ id: 'BK-TEST01' }))

    const { user } = renderBookingPage()

    await user.type(await screen.findByLabelText('Имя и фамилия'), 'Айгерим Сериковна')
    await user.type(screen.getByLabelText('Email'), 'aigerim@example.kz')
    await user.type(screen.getByLabelText('Телефон'), '+7 701 000 00 00')
    await user.selectOptions(screen.getByLabelText('Дата вылета'), 'dep-01')
    await user.click(screen.getByRole('button', { name: 'Забронировать без оплаты' }))

    expect(await screen.findByText('Бронь оформлена')).toBeInTheDocument()

    expect(createBooking).toHaveBeenCalledWith({
      tourId: 'ge-tbilisi-01',
      departureId: 'dep-01',
      guests: 2,
      customer: {
        name: 'Айгерим Сериковна',
        email: 'aigerim@example.kz',
        phone: '+7 701 000 00 00',
      },
    })
  })

  it('блокирует отправку, когда гостей больше, чем свободных мест', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)

    const { user } = renderBookingPage()

    await user.selectOptions(await screen.findByLabelText('Дата вылета'), 'dep-02')
    await user.selectOptions(screen.getByLabelText('Гостей'), '5')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'На выбранный вылет осталось мест: 2',
    )
    expect(screen.getByRole('button', { name: 'Забронировать без оплаты' })).toBeDisabled()
  })

  it('показывает ошибку сервера, не теряя введённые данные', async () => {
    vi.spyOn(api, 'getTour').mockResolvedValue(TOUR)
    vi.spyOn(api, 'createBooking').mockRejectedValue(new ApiError(400, 'Мест уже нет'))

    const { user } = renderBookingPage()

    await user.type(await screen.findByLabelText('Имя и фамилия'), 'Айгерим Сериковна')
    await user.type(screen.getByLabelText('Email'), 'aigerim@example.kz')
    await user.type(screen.getByLabelText('Телефон'), '+7 701 000 00 00')
    await user.selectOptions(screen.getByLabelText('Дата вылета'), 'dep-01')
    await user.click(screen.getByRole('button', { name: 'Забронировать без оплаты' }))

    expect(await screen.findByText('Мест уже нет')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя и фамилия')).toHaveValue('Айгерим Сериковна')
  })

  it('сообщает, что тур не найден, вместо пустой формы', async () => {
    vi.spyOn(api, 'getTour').mockRejectedValue(new ApiError(404, 'Тур не найден'))

    renderBookingPage('/tours/нет-такого/book')

    expect(await screen.findByRole('alert')).toHaveTextContent('Тур не найден')
  })
})
