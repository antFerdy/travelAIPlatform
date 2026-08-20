# Tour AI Service

Небольшой Python-сервис чат-бота для командного сайта продажи туров. Сервис
создаёт OpenAI-агента, подключает локальный MCP-сервер с инструментами каталога,
хранит историю по `session_id` в SQLite и получает туры из Go-backend.

## Что реализовано

- `POST /chat` — диалог с агентом;
- `GET /health` — проверка доступности сервиса;
- MCP tools: `search_tours`, `get_tour_details`, `compare_tours`;
- краткосрочная SQLite-память;
- Go HTTP gateway;
- тесты без платных запросов к OpenAI.

## Быстрый запуск

Требуется Python 3.11+.

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
```

Добавьте настоящий `OPENAI_API_KEY` в `.env`, затем запустите:

```bash
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Проверка:

```bash
curl http://127.0.0.1:8000/health

curl -X POST http://127.0.0.1:8000/chat \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"demo-1","message":"Найди тур в Турцию до 500000 KZT"}'
```

## Подключение к Go-backend

AI-сервис всегда получает каталог из Go-backend. Перед запуском укажите его URL:

```dotenv
BACKEND_URL=http://localhost:8080
```

Ожидаемые Go-маршруты:

- `GET /api/v1/countries` — справочник `{id, name, code}` для преобразования
  названия страны в `country_id`;
- `GET /api/v1/tours` — envelope `items/page/limit/total` и параметры
  `country_id`, `min_price`, `max_price`, `date_from`, `date_to`, `page`, `limit`;
- `GET /api/v1/tours/{tour_id}` — подробности тура.

Go должен возвращать поля, соответствующие модели `Tour` из `app/schemas.py`.
Если Go-backend недоступен, AI-сервис возвращает ошибку зависимости и не
подменяет каталог локальными данными.

## Подключение фронтенда

Чат открывается в браузере и ходит в `/chat` напрямую, поэтому origin
фронтенда должен быть разрешён. Локальная разработка покрыта по умолчанию:
разрешён `http://localhost` и `http://127.0.0.1` с любым портом. Для другого
адреса задайте `ALLOWED_ORIGINS` JSON-массивом:

```dotenv
ALLOWED_ORIGINS=["https://tours.example"]
```

На стороне фронтенда адрес сервиса задаётся переменной
`VITE_AI_API_BASE_URL` (см. `frontend/.env.example`).

## Память

Клиент отправляет стабильный `session_id`. История разных идентификаторов
изолирована. Локальная база создаётся по пути `MEMORY_DB_PATH`; файлы `*.db`
игнорируются Git.

## Тесты

```bash
.venv/bin/python -m pytest -q
```

Тесты используют fake runner, mock HTTP transport и локальный MCP-процесс,
поэтому API-ключ и оплачиваемые запросы для них не требуются.

## Структура

```text
app/main.py         FastAPI и HTTP-контракт
app/agent.py        агент, промпт, MCP и память
app/mcp_server.py   три MCP-инструмента
app/backend.py      адаптер точного Go API-контракта
app/memory.py       SQLite-память
docs/WORKFLOW.md    описание вклада и демонстрации
../ai-rules/        персональные правила участников в корне проекта
```
