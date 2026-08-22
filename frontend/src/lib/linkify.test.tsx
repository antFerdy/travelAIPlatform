import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { linkify } from './linkify'

describe('linkify', () => {
  it('текст без ссылок возвращает как есть', () => {
    render(<p>{linkify('Обычный ответ без ссылок')}</p>)

    expect(screen.getByText('Обычный ответ без ссылок')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('превращает URL в кликабельную ссылку', () => {
    render(<p>{linkify('Вот подходящий тур: http://localhost:5173/tours/5')}</p>)

    const link = screen.getByRole('link', { name: 'http://localhost:5173/tours/5' })

    expect(link).toHaveAttribute('href', 'http://localhost:5173/tours/5')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
  })

  it('сохраняет текст до и после ссылки', () => {
    render(<p>{linkify('Смотрите: http://localhost:5173/tours/5 — отличный вариант')}</p>)

    expect(screen.getByText(/Смотрите:/)).toBeInTheDocument()
    expect(screen.getByText(/отличный вариант/)).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveTextContent('http://localhost:5173/tours/5')
  })

  it('не включает хвостовую пунктуацию в ссылку', () => {
    render(<p>{linkify('Подробнее: http://localhost:5173/tours/5.')}</p>)

    expect(screen.getByRole('link')).toHaveAttribute('href', 'http://localhost:5173/tours/5')
  })

  it('обрабатывает несколько ссылок в одном сообщении', () => {
    render(
      <p>{linkify('Сравните: http://localhost:5173/tours/1 и http://localhost:5173/tours/2')}</p>,
    )

    expect(screen.getAllByRole('link')).toHaveLength(2)
  })
})
