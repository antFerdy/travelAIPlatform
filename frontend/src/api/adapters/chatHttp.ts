import {
  ApiError,
  CHAT_SESSION_ID_PATTERN,
  MAX_CHAT_MESSAGE_LENGTH,
  type ChatApi,
  type ChatRequest,
} from '../contract'
import { chatErrorSchema, chatReplySchema } from '../schemas'

/** У AI-сервиса единственная рабочая ручка. */
const CHAT_PATH = '/chat'

function baseUrl(): string {
  const configured = import.meta.env.VITE_AI_API_BASE_URL

  if (!configured) {
    throw new ApiError(0, 'Не задан VITE_AI_API_BASE_URL. См. .env.example')
  }

  return configured.replace(/\/$/, '')
}

/** FastAPI кладёт причину в detail: строкой или списком ошибок валидации. */
async function readError(response: Response): Promise<string> {
  try {
    const parsed = chatErrorSchema.safeParse(await response.json())

    if (parsed.success) {
      const { detail } = parsed.data

      if (typeof detail === 'string') return detail

      const first = detail[0]

      if (first) return first.msg
    }
  } catch {
    // Тело не JSON — довольствуемся статусом.
  }

  return `Запрос завершился со статусом ${response.status}`
}

export const httpChatApi: ChatApi = {
  async sendMessage({ sessionId, message }: ChatRequest): Promise<string> {
    // Сервис отвечает 422 на такие запросы — ловим до сети, чтобы не гонять её зря.
    if (!CHAT_SESSION_ID_PATTERN.test(sessionId)) {
      throw new ApiError(422, 'Идентификатор сессии не соответствует контракту сервиса')
    }

    const text = message.trim()

    if (!text) throw new ApiError(422, 'Сообщение не может быть пустым')

    if (text.length > MAX_CHAT_MESSAGE_LENGTH) {
      throw new ApiError(422, `Сообщение длиннее ${MAX_CHAT_MESSAGE_LENGTH} символов`)
    }

    let response: Response

    try {
      response = await fetch(`${baseUrl()}${CHAT_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      })
    } catch (cause) {
      throw new ApiError(0, `AI-сервис недоступен: ${String(cause)}`)
    }

    if (!response.ok) {
      throw new ApiError(response.status, await readError(response))
    }

    // Разбор ответа — тоже часть контракта: расхождение показываем пользователю
    // как ошибку помощника, а не роняем рендер чата.
    try {
      return chatReplySchema.parse(await response.json())
    } catch {
      throw new ApiError(response.status, 'Ответ AI-сервиса не соответствует контракту')
    }
  },
}
