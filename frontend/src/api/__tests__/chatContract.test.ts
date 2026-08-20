import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { AI_ORIGIN, mswServer } from '@/test/mswServer'

import { ApiError } from '../contract'
import { chatApi } from '../index'

/**
 * Контракт AI-сервиса: `POST /chat` из ai-service/README.md.
 * На проводе snake_case, ошибки приходят полем `detail` (FastAPI),
 * 422 — не прошло валидацию, 503 — агент недоступен.
 */
describe('chatApi.sendMessage', () => {
  it('возвращает ответ помощника', async () => {
    const reply = await chatApi.sendMessage({ sessionId: 'demo-1', message: 'Хочу в Турцию' })

    expect(reply).toContain('Хочу в Турцию')
  })

  it('отправляет тело в snake_case, как ждёт FastAPI', async () => {
    let received: unknown

    mswServer.use(
      http.post(`${AI_ORIGIN}/chat`, async ({ request }) => {
        received = await request.json()

        return HttpResponse.json({ session_id: 'demo-1', message: 'ок' })
      }),
    )

    await chatApi.sendMessage({ sessionId: 'demo-1', message: 'Привет' })

    expect(received).toEqual({ session_id: 'demo-1', message: 'Привет' })
  })

  it('обрезает пробелы, чтобы не получить 422 за пустое сообщение', async () => {
    let received: unknown

    mswServer.use(
      http.post(`${AI_ORIGIN}/chat`, async ({ request }) => {
        received = await request.json()

        return HttpResponse.json({ session_id: 'demo-1', message: 'ок' })
      }),
    )

    await chatApi.sendMessage({ sessionId: 'demo-1', message: '  Привет  ' })

    expect(received).toMatchObject({ message: 'Привет' })
  })

  it('превращает 503 в ApiError с текстом сервиса', async () => {
    mswServer.use(
      http.post(`${AI_ORIGIN}/chat`, () =>
        HttpResponse.json({ detail: 'AI service is temporarily unavailable' }, { status: 503 }),
      ),
    )

    const failure = await chatApi
      .sendMessage({ sessionId: 'demo-1', message: 'Привет' })
      .catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ status: 503, message: 'AI service is temporarily unavailable' })
  })

  it('сообщает статусом 0, что до сервиса не достучались', async () => {
    mswServer.use(http.post(`${AI_ORIGIN}/chat`, () => HttpResponse.error()))

    const failure = await chatApi
      .sendMessage({ sessionId: 'demo-1', message: 'Привет' })
      .catch((error: unknown) => error)

    expect(failure).toMatchObject({ status: 0 })
  })

  it('не пропускает ответ, не соответствующий контракту', async () => {
    mswServer.use(
      http.post(`${AI_ORIGIN}/chat`, () => HttpResponse.json({ answer: 'поле не то' })),
    )

    const failure = await chatApi
      .sendMessage({ sessionId: 'demo-1', message: 'Привет' })
      .catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
  })

  it('отклоняет session_id, который не примет сервис', async () => {
    const failure = await chatApi
      .sendMessage({ sessionId: 'демо 1', message: 'Привет' })
      .catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({ status: 422 })
  })
})
