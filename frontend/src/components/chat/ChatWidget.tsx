import { useMutation } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'

import { ApiError, chatApi } from '@/api'
import { getChatSessionId } from '@/lib/chatSession'
import type { ChatMessage } from '@/types/chat'

import { ChatLauncher } from './ChatLauncher'
import { ChatPanel } from './ChatPanel'
import { GREETING } from './chatIntro'

/**
 * Плавающий чат с ИИ-помощником.
 *
 * Ответы даёт ai-service (`POST /chat`), историю диалога он же и хранит — по
 * session_id, поэтому клиент отправляет только последнее сообщение. Падение
 * сервиса видно в окне чата и ничего больше на сайте не ломает.
 */
export function ChatWidget(): ReactElement {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])

  const launcherRef = useRef<HTMLButtonElement>(null)
  const messageCounterRef = useRef(0)
  const wasOpenRef = useRef(false)
  const lastMessageRef = useRef('')

  const sessionId = useMemo(() => getChatSessionId(), [])

  const ask = useMutation({
    mutationFn: (text: string) => chatApi.sendMessage({ sessionId, message: text }),
    onSuccess: (reply) => {
      setMessages((current) => [...current, createMessage('bot', reply, messageCounterRef)])
    },
  })

  const close = useCallback(() => setOpen(false), [])

  // Фокус возвращается на кнопку только после перерисовки: на узком экране
  // кнопка скрыта, пока окно открыто, а скрытый элемент фокус не принимает.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true

      return
    }

    if (!wasOpenRef.current) return

    wasOpenRef.current = false
    launcherRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  function handleSend(text: string): void {
    const trimmed = text.trim()

    if (!trimmed) return

    lastMessageRef.current = trimmed
    setMessages((current) => [...current, createMessage('user', trimmed, messageCounterRef)])
    ask.mutate(trimmed)
  }

  function handleRetry(): void {
    // Сообщение пользователя уже в ленте — повторяем только запрос.
    if (lastMessageRef.current) ask.mutate(lastMessageRef.current)
  }

  return (
    <>
      <ChatLauncher
        open={open}
        onClick={() => (open ? close() : setOpen(true))}
        buttonRef={launcherRef}
      />

      {open ? (
        <ChatPanel
          messages={messages}
          pending={ask.isPending}
          error={ask.isError ? describeError(ask.error) : null}
          onSend={handleSend}
          onRetry={handleRetry}
          onClose={close}
        />
      ) : null}
    </>
  )
}

function createMessage(
  role: ChatMessage['role'],
  text: string,
  counter: { current: number },
): ChatMessage {
  counter.current += 1

  return { id: `${role}-${counter.current}`, role, text }
}

/** Текст для пользователя: сетевой сбой и отказ агента выглядят по-разному. */
function describeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) {
      return 'Помощник недоступен: не удалось связаться с AI-сервисом.'
    }

    if (error.status >= 500) {
      return 'Помощник сейчас не отвечает. Попробуйте ещё раз через минуту.'
    }

    return `Помощник не принял запрос: ${error.message}`
  }

  return 'Помощник не смог ответить.'
}
