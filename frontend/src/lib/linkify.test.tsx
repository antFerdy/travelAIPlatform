import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { linkify } from './linkify'

describe('linkify', () => {
  it('текст без ссылок возвращает как есть', () => {
    render(<p>{linkify('Обычный ответ без ссылок')}</p>)

    expect(screen.getByText('Обычный ответ без ссылок')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('ссылку на тур превращает в кликабельную ссылку с читаемой подписью', () => {
    render(<p>{linkify('Вот подходящий тур: http://localhost:5173/tours/5')}</p>)

    const link = screen.getByRole('link', { name: 'Смотреть тур →' })

    expect(link).toHaveAttribute('href', 'http://localhost:5173/tours/5')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(screen.queryByText('http://localhost:5173/tours/5')).not.toBeInTheDocument()
  })

  it('ссылку не на тур показывает как есть', () => {
    render(<p>{linkify('Подробнее на https://example.com/about')}</p>)

    expect(screen.getByRole('link', { name: 'https://example.com/about' })).toHaveAttribute(
      'href',
      'https://example.com/about',
    )
  })

  it('сохраняет текст до и после ссылки', () => {
    render(<p>{linkify('Смотрите: http://localhost:5173/tours/5 — отличный вариант')}</p>)

    expect(screen.getByText(/Смотрите:/)).toBeInTheDocument()
    expect(screen.getByText(/отличный вариант/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('не включает хвостовую пунктуацию в ссылку', () => {
    render(<p>{linkify('Подробнее: http://localhost:5173/tours/5.')}</p>)

    expect(screen.getByRole('link')).toHaveAttribute('href', 'http://localhost:5173/tours/5')
  })

  it('обрабатывает несколько ссылок на туры в одном сообщении', () => {
    render(
      <p>{linkify('Сравните: http://localhost:5173/tours/1 и http://localhost:5173/tours/2')}</p>,
    )

    const links = screen.getAllByRole('link', { name: 'Смотреть тур →' })

    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', 'http://localhost:5173/tours/1')
    expect(links[1]).toHaveAttribute('href', 'http://localhost:5173/tours/2')
  })
})
