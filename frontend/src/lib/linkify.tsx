import type { ReactNode } from 'react'

const URL_PATTERN = /https?:\/\/[^\s<>"]+/g
const TRAILING_PUNCTUATION = /[.,!?);:]$/

/**
 * Разбивает текст на обычные фрагменты и кликабельные ссылки.
 *
 * Ответ AI-помощника — обычный текст (`ChatBubble` не парсит markdown), но
 * промпт агента просит присылать ссылку на тур отдельной строкой как есть.
 * Хвостовая пунктуация («.», закрывающая скобка) выводится за пределы
 * ссылки, чтобы конец предложения не становился частью URL.
 */
export function linkify(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let key = 0

  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index
    let url = match[0]
    let end = start + url.length

    while (url.length > 0 && TRAILING_PUNCTUATION.test(url)) {
      url = url.slice(0, -1)
      end -= 1
    }

    if (url.length === 0) continue

    if (start > lastIndex) parts.push(text.slice(lastIndex, start))

    parts.push(
      <a
        key={`link-${key++}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        {url}
      </a>,
    )

    lastIndex = end
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex))

  return parts
}
