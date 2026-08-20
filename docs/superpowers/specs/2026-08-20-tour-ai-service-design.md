# Tour AI Service Design

## Goal

Build a small Python service for the team tour-sales project. The service creates
an AI agent that remembers a conversation, discovers and calls tour tools through
MCP, and reads real tour data from the Go backend. Until that backend exists, the
same tools use a local mock catalog so the service can be demonstrated and tested.

## Scope

The first version supports:

- `POST /chat` for a user message and `session_id`;
- `GET /health` for a basic readiness check;
- one OpenAI tour assistant agent;
- short-term conversation memory keyed by `session_id`;
- MCP tools for searching, reading, and comparing tours;
- Go-backend access with a mock fallback;
- concise JSON responses suitable for the future frontend;
- automated tests for HTTP contracts, tool behavior, and memory isolation;
- a personal root-level `ai-rules/ai_duman_zhanbolatov.md` file and workflow documentation.

Streaming, authentication, booking, payments, vector databases, multiple agents,
and a production database are intentionally outside this version.

## Architecture

```text
Frontend
   |
   | POST /chat
   v
FastAPI service
   |
   v
OpenAI Tour Assistant Agent
   |-- system instructions
   |-- SQLite session memory
   `-- MCP tool discovery and calls
          |-- search_tours
          |-- get_tour_details
          `-- compare_tours
                    |
                    v
             Tour data gateway
               |          |
               v          v
          Go backend   mock catalog
```

The FastAPI service owns the public AI endpoint. The agent does not invent tour
records: it must call an MCP tool whenever it recommends or compares tours. MCP
tools delegate data access to a small gateway. The gateway calls the Go backend
when `BACKEND_URL` is configured and available; otherwise it reads the bundled
mock JSON when `USE_MOCK_BACKEND=true`.

## Components

### HTTP API

`POST /chat` accepts:

```json
{
  "session_id": "demo-user-1",
  "message": "Найди тур в Турцию до 500000 тенге"
}
```

It returns:

```json
{
  "session_id": "demo-user-1",
  "message": "Я нашёл подходящие варианты..."
}
```

Invalid requests return `422`. A missing API key or unavailable model returns a
service error without exposing credentials or internal exception details.

### Agent

The service creates one reusable agent definition with Russian-first instructions.
The agent asks for missing constraints, keeps answers brief, uses only tool results
for factual tour data, and never claims that a booking or payment was completed.

### MCP and tools

A local MCP server exposes three read-only tools:

- `search_tours(country, min_price, max_price, date_from, date_to, page, limit)`;
- `get_tour_details(tour_id)`;
- `compare_tours(tour_ids)`.

The agent connects to the MCP server over a local subprocess transport. This keeps
the MCP usage real and visible while avoiding another deployable HTTP service.
Tool calls are logged by name, but arguments that may contain personal information
are not logged verbatim.

### Backend gateway

The gateway keeps Go integration behind one interface and follows the team's
versioned backend contract:

- `GET /api/v1/countries` to resolve a country name or code to `country_id`;
- `GET /api/v1/tours` with `country_id`, price, date, and pagination filters;
- `GET /api/v1/tours/{id}` for details.

The tours list is read from the backend envelope
`{"items": [...], "page": 1, "limit": 20, "total": 1}`. Tour fields match the
Go contract: numeric `id`, `country_id`, `price`, `currency`, dates, duration,
category, image URL, description, and creation time.

The exact route paths remain configurable. HTTP calls use short timeouts and raise
clear typed errors. Mock fallback is allowed only when explicitly enabled; it must
not silently replace a failing production backend.

### Memory

Conversation history is stored in a local SQLite file and isolated by
`session_id`. The API does not accept arbitrary history from the browser. This is
short-term demonstration memory, not a user-profile database. Tests use temporary
SQLite files.

## Configuration

The service reads configuration from environment variables:

- `OPENAI_API_KEY` — required for real agent calls;
- `OPENAI_MODEL` — model identifier with a documented default;
- `BACKEND_URL` — base URL of the Go backend;
- `USE_MOCK_BACKEND` — explicitly enables the mock catalog;
- `MEMORY_DB_PATH` — SQLite file location;
- `REQUEST_TIMEOUT_SECONDS` — backend request timeout.

Only `.env.example` is committed. Real keys remain outside version control.

## File Layout

```text
ai-service/
├── app/
│   ├── main.py
│   ├── agent.py
│   ├── config.py
│   ├── schemas.py
│   ├── memory.py
│   ├── backend.py
│   └── mcp_server.py
├── data/
│   ├── mock_countries.json
│   └── mock_tours.json
├── docs/
│   ├── WORKFLOW.md
│   └── superpowers/specs/
├── tests/
├── .env.example
├── .gitignore
├── Dockerfile
├── requirements.txt
└── README.md

../ai-rules/ai_duman_zhanbolatov.md
```

## Error Handling

- Reject blank messages and invalid session identifiers at the API boundary.
- Return a friendly response when no tour matches.
- Distinguish Go-backend failures from an empty search result.
- Never expose the OpenAI key, raw stack traces, or backend credentials.
- Limit tool iterations so a malformed model response cannot loop forever.

## Testing

Tests do not require a paid OpenAI call. The model runner is replaced by a fake for
API and memory tests. Tool tests use the mock catalog and a fake backend transport.
A separate optional smoke command verifies a real OpenAI call when a key is present.

## Success Criteria

The design is complete when:

1. the service starts locally and `/health` returns success;
2. `/chat` validates its request and returns the documented response shape;
3. the agent can discover and invoke all three MCP tools;
4. tools call the Go gateway or explicit mock fallback;
5. two messages with one `session_id` share context while different sessions do not;
6. automated tests pass without external services;
7. README, WORKFLOW, `.env.example`, and personal AI rules explain how to run and
   demonstrate the contribution.
