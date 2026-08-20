import type { ReactElement } from 'react'

import { cn } from '@/lib/cn'
import type { ChatMessage } from '@/types/chat'

export type ChatBubbleProps = {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps): ReactElement {
  const isBot = message.role === 'bot'

  return (
    <li className={cn('flex', isBot ? 'justify-start' : 'justify-end')}>
      <p
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line',
          isBot
            ? 'text-ink-800 ring-ink-200 rounded-bl-md bg-white ring-1'
            : 'bg-brand-700 rounded-br-md text-white',
        )}
      >
        {message.text}
      </p>
    </li>
  )
}
