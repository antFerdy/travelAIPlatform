import { useEffect, useRef, useState, type FormEvent, type ReactElement } from 'react'

import type { ChatMessage } from '@/types/chat'

import { ChatBubble } from './ChatBubble'

export type ChatPanelProps = {
  messages: ChatMessage[]
  /** Бот «печатает» — ответ ещё не пришёл. */
  pending: boolean
  /** Текст ошибки помощника; null — всё в порядке. */
  error: string | null
  onSend: (text: string) => void
  onRetry: () => void
  onClose: () => void
}

export function ChatPanel({
  messages,
  pending,
  error,
  onSend,
  onRetry,
  onClose,
}: ChatPanelProps): ReactElement {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const feedEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    // scrollIntoView есть не в каждой среде (jsdom), поэтому вызов необязательный.
    feedEndRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages, pending, error])

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (!draft.trim()) return

    onSend(draft)
    setDraft('')
  }

  return (
    <section
      role="dialog"
      aria-label="Чат с ИИ-помощником"
      className="ring-ink-200 fixed z-40 flex flex-col overflow-hidden bg-white shadow-2xl ring-1 max-sm:inset-0 sm:right-5 sm:bottom-24 sm:h-[min(70vh,34rem)] sm:w-[23.5rem] sm:rounded-2xl"
    >
      <header className="bg-brand-700 flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div>
          <p className="text-sm font-semibold">ИИ-помощник</p>
          <p className="text-brand-100 text-xs">Подскажет, какой тур выбрать</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть чат"
          className="hover:bg-brand-800 rounded-lg p-1.5 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      <ul
        role="log"
        aria-live="polite"
        aria-label="История переписки"
        className="bg-ink-50 flex flex-1 flex-col gap-2.5 overflow-y-auto p-4"
      >
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {pending ? <TypingBubble /> : null}

        {error ? (
          <li role="alert" className="flex flex-col items-start gap-2 rounded-2xl bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-100"
            >
              Повторить
            </button>
          </li>
        ) : null}

        <div ref={feedEndRef} />
      </ul>

      <form onSubmit={handleSubmit} className="border-ink-200 flex items-center gap-2 border-t p-3">
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Сообщение"
          placeholder="Спросите про тур…"
          maxLength={2000}
          autoComplete="off"
          className="border-ink-200 text-ink-800 placeholder:text-ink-400 focus:border-brand-500 w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
        />

        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Отправить сообщение"
          className="bg-brand-700 hover:bg-brand-800 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M4.5 12h13M11.5 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </section>
  )
}

function TypingBubble(): ReactElement {
  return (
    <li className="flex justify-start">
      <p
        role="status"
        className="text-ink-500 ring-ink-200 rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-sm ring-1"
      >
        Печатает…
      </p>
    </li>
  )
}
