import { describe, expect, it } from 'vitest'

import { CHAT_SESSION_ID_PATTERN } from '@/api/contract'

import { CHAT_SESSION_STORAGE_KEY, getChatSessionId } from './chatSession'

/**
 * Память диалога живёт на стороне AI-сервиса и привязана к session_id,
 * поэтому идентификатор обязан пережить перезагрузку страницы и совпасть
 * с форматом, который принимает сервис.
 */
describe('getChatSessionId', () => {
  it('возвращает один и тот же идентификатор при повторных вызовах', () => {
    expect(getChatSessionId()).toBe(getChatSessionId())
  })

  it('переживает перезагрузку страницы', () => {
    const first = getChatSessionId()

    // Модуль перечитывает значение из localStorage, а не держит его в памяти.
    expect(localStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBe(first)
    expect(getChatSessionId()).toBe(first)
  })

  it('выдаёт идентификатор в формате, который принимает сервис', () => {
    expect(getChatSessionId()).toMatch(CHAT_SESSION_ID_PATTERN)
  })

  it('заменяет сохранённое значение, если оно не подходит под контракт', () => {
    localStorage.setItem(CHAT_SESSION_STORAGE_KEY, 'сломанный id')

    const id = getChatSessionId()

    expect(id).toMatch(CHAT_SESSION_ID_PATTERN)
    expect(localStorage.getItem(CHAT_SESSION_STORAGE_KEY)).toBe(id)
  })
})
