import { screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { AI_ORIGIN, mswServer } from '@/test/mswServer'
import { renderWithProviders } from '@/test/renderWithProviders'

import { ChatWidget } from './ChatWidget'
import { GREETING } from './chatIntro'

const LAUNCHER = 'Открыть чат с ИИ-помощником'

function input(): HTMLElement {
  return screen.getByRole('textbox', { name: 'Сообщение' })
}

describe('ChatWidget', () => {
  it('по умолчанию показывает только кнопку, окно чата закрыто', () => {
    renderWithProviders(<ChatWidget />)

    expect(screen.getByRole('button', { name: LAUNCHER })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('открывает окно с приветствием по клику на иконку', async () => {
    const { user } = renderWithProviders(<ChatWidget />)

    await user.click(screen.getByRole('button', { name: LAUNCHER }))

    expect(screen.getByRole('dialog', { name: /ИИ-помощник/ })).toBeInTheDocument()
    expect(screen.getByText(GREETING.text)).toBeInTheDocument()
  })

  it('переводит фокус в поле ввода при открытии', async () => {
    const { user } = renderWithProviders(<ChatWidget />)

    await user.click(screen.getByRole('button', { name: LAUNCHER }))

    await waitFor(() => expect(input()).toHaveFocus())
  })

  it('закрывается по Escape и возвращает фокус на кнопку', async () => {
    const { user } = renderWithProviders(<ChatWidget />)
    const launcher = screen.getByRole('button', { name: LAUNCHER })

    await user.click(launcher)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(launcher).toHaveFocus()
  })

  it('показывает ответ AI-сервиса на отправленное сообщение', async () => {
    const { user } = renderWithProviders(<ChatWidget />)

    await user.click(screen.getByRole('button', { name: LAUNCHER }))
    await user.type(input(), 'Хочу в Турцию{Enter}')

    expect(screen.getByText('Хочу в Турцию')).toBeInTheDocument()
    expect(await screen.findByText(/Подобрал варианты по запросу/)).toBeInTheDocument()
    expect(input()).toHaveValue('')
  })

  it('шлёт сообщения одной сессии с одним session_id — память диалога на сервисе', async () => {
    const sessions: string[] = []

    mswServer.use(
      http.post(`${AI_ORIGIN}/chat`, async ({ request }) => {
        const body = (await request.json()) as { session_id: string }

        sessions.push(body.session_id)

        return HttpResponse.json({ session_id: body.session_id, message: 'Готово' })
      }),
    )

    const { user } = renderWithProviders(<ChatWidget />)

    await user.click(screen.getByRole('button', { name: LAUNCHER }))
    await user.type(input(), 'Хочу в Турцию{Enter}')
    await screen.findByText('Готово')
    await user.type(input(), 'До 800 000 ₸{Enter}')

    await waitFor(() => expect(sessions).toHaveLength(2))
    expect(sessions[0]).toBe(sessions[1])
    expect(sessions[0]).toBeTruthy()
  })

  it('не отправляет пустое сообщение', async () => {
    const { user } = renderWithProviders(<ChatWidget />)

    await user.click(screen.getByRole('button', { name: LAUNCHER }))
    await user.type(input(), '   {Enter}')

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('сообщает, что помощник недоступен, и повторяет отправку по кнопке', async () => {
    mswServer.use(
      http.post(
        `${AI_ORIGIN}/chat`,
        () => HttpResponse.json({ detail: 'AI service is temporarily unavailable' }, { status: 503 }),
        { once: true },
      ),
    )

    const { user } = renderWithProviders(<ChatWidget />)

    await user.click(screen.getByRole('button', { name: LAUNCHER }))
    await user.type(input(), 'Хочу в Турцию{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent(/помощник/i)

    await user.click(screen.getByRole('button', { name: 'Повторить' }))

    expect(await screen.findByText(/Подобрал варианты по запросу/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('не дублирует сообщение пользователя при повторной отправке', async () => {
    mswServer.use(
      http.post(`${AI_ORIGIN}/chat`, () => HttpResponse.json({ detail: 'нет связи' }, { status: 503 }), {
        once: true,
      }),
    )

    const { user } = renderWithProviders(<ChatWidget />)

    await user.click(screen.getByRole('button', { name: LAUNCHER }))
    await user.type(input(), 'Хочу в Турцию{Enter}')
    await screen.findByRole('alert')
    await user.click(screen.getByRole('button', { name: 'Повторить' }))
    await screen.findByText(/Подобрал варианты по запросу/)

    expect(screen.getAllByText('Хочу в Турцию')).toHaveLength(1)
  })
})
