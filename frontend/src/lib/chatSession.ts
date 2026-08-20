import { CHAT_SESSION_ID_PATTERN } from '@/api/contract'

/** Ключ, под которым лежит идентификатор диалога с помощником. */
export const CHAT_SESSION_STORAGE_KEY = 'tours.chat.session'

/**
 * Идентификатор диалога для AI-сервиса.
 *
 * Историю переписки хранит сервис — по этому идентификатору. Поэтому он
 * переживает перезагрузку страницы и не зависит от состояния React.
 * Приватный режим браузера может запретить localStorage: тогда сессия живёт
 * до перезагрузки, но чат продолжает работать.
 */
export function getChatSessionId(): string {
  const stored = readStored()

  if (stored) return stored

  const created = createSessionId()

  try {
    localStorage.setItem(CHAT_SESSION_STORAGE_KEY, created)
  } catch {
    // Хранилище недоступно — идентификатор просто не переживёт перезагрузку.
  }

  return created
}

function readStored(): string | null {
  let stored: string | null = null

  try {
    stored = localStorage.getItem(CHAT_SESSION_STORAGE_KEY)
  } catch {
    return null
  }

  // Чужое или испорченное значение сервис отвергнет с 422 — заменяем его.
  return stored && CHAT_SESSION_ID_PATTERN.test(stored) ? stored : null
}

function createSessionId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()

  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
