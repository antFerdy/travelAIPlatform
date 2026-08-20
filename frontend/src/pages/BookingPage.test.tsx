import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Route, Routes, useParams } from 'react-router'
import { describe, expect, it } from 'vitest'

import { TOURS } from '@/test/fixtures'
import { API_ORIGIN, mswServer } from '@/test/mswServer'
import { renderWithProviders } from '@/test/renderWithProviders'

import { BookingPage } from './BookingPage'

const TOUR = TOURS[0]!

function BookingProbe() {
  const { bookingId } = useParams<{ bookingId: string }>()

  return <p>бронь №{bookingId}</p>
}

function renderBookingPage(route = `/tours/${TOUR.id}/book`) {
  return renderWithProviders(
    <Routes>
      <Route path="/tours/:tourId/book" element={<BookingPage />} />
      <Route path="/bookings/:bookingId" element={<BookingProbe />} />
    </Routes>,
    { route },
  )
}

async function fillForm(user: ReturnType<typeof renderBookingPage>['user']) {
  await user.type(await screen.findByLabelText('Имя и фамилия'), 'Айгерим Сериковна')
  await user.type(screen.getByLabelText('Email'), 'aigerim@example.kz')
  await user.type(screen.getByLabelText('Телефон'), '+7 701 000 00 00')
}

describe('BookingPage', () => {
  it('показывает выбранный тур и его даты', async () => {
    renderBookingPage()

    expect(await screen.findByRole('heading', { name: 'Бронирование' })).toBeInTheDocument()
    // Название встречается дважды: в хлебных крошках и в карточке справа
    expect(screen.getAllByText(TOUR.title).length).toBeGreaterThan(0)
    expect(screen.getByText(/Даты поездки заданы туром/)).toBeInTheDocument()
  })

  it('не отправляет пустую форму и объясняет, что не так', async () => {
    const { user } = renderBookingPage()

    await user.click(await screen.findByRole('button', { name: 'Забронировать без оплаты' }))

    expect(await screen.findByText('Укажите имя и фамилию')).toBeInTheDocument()
    expect(screen.getByText(/Проверьте адрес/)).toBeInTheDocument()
    expect(screen.getByText(/Укажите номер/)).toBeInTheDocument()
  })

  it('создаёт бронь и уводит на подтверждение', async () => {
    const { user } = renderBookingPage()

    await fillForm(user)
    await user.selectOptions(screen.getByLabelText('Сколько человек'), '3')
    await user.click(screen.getByRole('button', { name: 'Забронировать без оплаты' }))

    expect(await screen.findByText(/бронь №\d+/)).toBeInTheDocument()
  })

  it('отправляет на сервер именно то, что ввели', async () => {
    let received: unknown

    mswServer.use(
      http.post(`${API_ORIGIN}/api/v1/bookings`, async ({ request }) => {
        received = await request.json()

        return HttpResponse.json(
          {
            id: 7,
            tour_id: TOUR.id,
            customer_name: 'Айгерим Сериковна',
            customer_email: 'aigerim@example.kz',
            customer_phone: '+7 701 000 00 00',
            num_people: 3,
            status: 'pending',
            created_at: '2026-08-20T16:12:08Z',
          },
          { status: 201 },
        )
      }),
    )

    const { user } = renderBookingPage()

    await fillForm(user)
    await user.selectOptions(screen.getByLabelText('Сколько человек'), '3')
    await user.click(screen.getByRole('button', { name: 'Забронировать без оплаты' }))

    await screen.findByText('бронь №7')

    // Ключи в snake_case — как ждёт бэкенд
    expect(received).toEqual({
      tour_id: TOUR.id,
      customer_name: 'Айгерим Сериковна',
      customer_email: 'aigerim@example.kz',
      customer_phone: '+7 701 000 00 00',
      num_people: 3,
    })
  })

  it('показывает отказ сервера, не теряя введённые данные', async () => {
    mswServer.use(
      http.post(`${API_ORIGIN}/api/v1/bookings`, () =>
        HttpResponse.json({ error: 'tour is no longer available' }, { status: 422 }),
      ),
    )

    const { user } = renderBookingPage()

    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Забронировать без оплаты' }))

    expect(await screen.findByText('tour is no longer available')).toBeInTheDocument()
    expect(screen.getByLabelText('Имя и фамилия')).toHaveValue('Айгерим Сериковна')
  })

  it('сообщает, что тур не найден, вместо пустой формы', async () => {
    renderBookingPage('/tours/9999/book')

    expect(await screen.findByRole('alert')).toHaveTextContent('Не найдено')
  })

  it('сообщает о некорректном адресе тура', async () => {
    renderBookingPage('/tours/не-число/book')

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Тур не найден')
    })
  })
})
