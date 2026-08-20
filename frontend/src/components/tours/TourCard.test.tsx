import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeTour } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'

import { TourCard } from './TourCard'

describe('TourCard', () => {
  it('показывает страну, название, даты и цену', () => {
    const tour = makeTour({
      title: 'Стамбул: Kaya Madrid Hotel, 9 ночей',
      price: 735_000,
      currency: 'KZT',
      startDate: '2026-09-05',
      endDate: '2026-09-14',
      durationDays: 9,
    })

    renderWithProviders(<TourCard tour={tour} countryName="Турция" />)

    expect(
      screen.getByRole('heading', { name: 'Стамбул: Kaya Madrid Hotel, 9 ночей' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Турция')).toBeInTheDocument()
    expect(screen.getByText('9 ночей')).toBeInTheDocument()
    expect(screen.getByText(/735\D?000\s?₸/)).toBeInTheDocument()
    expect(screen.getByText(/14 сентября 2026/)).toBeInTheDocument()
  })

  it('ведёт на страницу тура по числовому id', () => {
    renderWithProviders(<TourCard tour={makeTour({ id: 42, title: 'Тур' })} />)

    // В карточке две ссылки на тур — картинка и заголовок; проверяем заголовок
    const heading = screen.getByRole('heading', { name: 'Тур' })

    expect(within(heading).getByRole('link')).toHaveAttribute('href', '/tours/42')
  })

  it('переводит категорию на русский', () => {
    renderWithProviders(<TourCard tour={makeTour({ category: 'beach' })} />)

    expect(screen.getByText('Пляжный')).toBeInTheDocument()
  })

  it('показывает незнакомую категорию как есть, а не прячет её', () => {
    renderWithProviders(<TourCard tour={makeTour({ category: 'safari' })} />)

    expect(screen.getByText('safari')).toBeInTheDocument()
  })

  it('обходится без категории, если бэкенд её не прислал', () => {
    const { category: _omitted, ...withoutCategory } = makeTour()

    renderWithProviders(<TourCard tour={withoutCategory} />)

    expect(screen.getByRole('heading')).toBeInTheDocument()
  })

  it('ставит прочерк, пока справочник стран не загрузился', () => {
    renderWithProviders(<TourCard tour={makeTour()} />)

    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('подставляет заглушку, если картинки нет', () => {
    const { imageUrl: _omitted, ...withoutImage } = makeTour({ title: 'Без фото' })

    renderWithProviders(<TourCard tour={withoutImage} />)

    expect(screen.getByRole('img')).toHaveAttribute('src', '/tour-placeholder.svg')
  })

  it('подставляет заглушку, если картинка не загрузилась', () => {
    const tour = makeTour({ imageUrl: 'https://example.invalid/broken.jpg', title: 'Тур' })

    renderWithProviders(<TourCard tour={tour} />)

    const image = screen.getByRole('img')
    fireEvent.error(image)

    expect(image).toHaveAttribute('src', '/tour-placeholder.svg')
  })
})
