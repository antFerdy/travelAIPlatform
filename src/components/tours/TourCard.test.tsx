import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeDeparture, makeTour } from '@/test/factories'
import { renderWithProviders } from '@/test/renderWithProviders'

import { TourCard } from './TourCard'

describe('TourCard', () => {
  it('показывает направление, название и цену за гостя', () => {
    const tour = makeTour({
      title: 'Анталия: пляжный отдых',
      country: 'Турция',
      city: 'Анталия',
      pricePerPerson: 420_000,
    })

    renderWithProviders(<TourCard tour={tour} />)

    expect(screen.getByRole('heading', { name: 'Анталия: пляжный отдых' })).toBeInTheDocument()
    expect(screen.getByText('Турция, Анталия')).toBeInTheDocument()
    expect(screen.getByText(/420\D?000\s?₸/)).toBeInTheDocument()
    expect(screen.getByText('за одного гостя')).toBeInTheDocument()
  })

  it('ведёт на страницу тура', () => {
    const tour = makeTour({ id: 'tr-antalya-01', title: 'Анталия' })

    renderWithProviders(<TourCard tour={tour} />)

    expect(screen.getByRole('link', { name: 'Анталия' })).toHaveAttribute(
      'href',
      '/tours/tr-antalya-01',
    )
  })

  it('называет категорию отеля словами, а не пятью одинаковыми звёздами', () => {
    renderWithProviders(<TourCard tour={makeTour({ hotelStars: 3 })} />)

    expect(screen.getByRole('img', { name: 'Отель 3 звезды' })).toBeInTheDocument()
  })

  it('предупреждает, когда мест на ближайшем вылете осталось мало', () => {
    const tour = makeTour({
      departures: [makeDeparture({ startDate: '2027-01-15', seatsLeft: 2 })],
    })

    renderWithProviders(<TourCard tour={tour} />)

    expect(screen.getByText(/осталось 2 места/)).toBeInTheDocument()
  })

  it('не предупреждает о местах, когда их много', () => {
    const tour = makeTour({
      departures: [makeDeparture({ startDate: '2027-01-15', seatsLeft: 25 })],
    })

    renderWithProviders(<TourCard tour={tour} />)

    expect(screen.queryByText(/осталось/)).not.toBeInTheDocument()
  })

  it('честно сообщает, что ближайших вылетов нет', () => {
    const tour = makeTour({
      departures: [makeDeparture({ startDate: '2020-01-01' })],
    })

    renderWithProviders(<TourCard tour={tour} />)

    expect(screen.getByText('нет ближайших вылетов')).toBeInTheDocument()
  })

  it('подставляет локальную заглушку, если картинка не загрузилась', () => {
    const tour = makeTour({ images: ['https://example.invalid/broken.jpg'], city: 'Батуми' })

    renderWithProviders(<TourCard tour={tour} />)

    const image = screen.getByRole('img', { name: /Батуми/ })
    fireEvent.error(image)

    expect(image).toHaveAttribute('src', '/tour-placeholder.svg')
  })
})
