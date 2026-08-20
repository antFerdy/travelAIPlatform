# Design: Tours Backend (Go + Echo + PostgreSQL)

Status: Approved
Date: 2026-08-20
Source requirements: `requirement.md` (project "2️⃣ Сайт по продаже туров")

## Context

This project implements the core backend for a tour-sales platform, one of
five allowed project types listed in `requirement.md`. Per the group-project
requirements, the site must fully work without AI; this spec covers only the
core backend (tours, filtering, anonymous booking). The AI chat-bot described
as an optional enhancement in `requirement.md` is out of scope — it is the AI
Engineer's responsibility and may consume this backend's API/data if needed,
but no dedicated AI-facing endpoint is designed here.

Out of scope, decided during brainstorming:
- Authentication / user accounts — booking is anonymous (name/email/phone in
  the request body only).
- Admin CRUD API for tours/countries — data is loaded once via a seed
  script/migration; the public API is read-only for catalog data.
- Seat/date availability enforcement — booking creates a record with a
  status field; no capacity checks or overbooking prevention.
- MCP usage during development — required by the group-project DoD for the
  Backend role, but tracked separately from this technical spec.

## Architecture

Layered architecture: `handler → service → repository`.

- **Echo** (`github.com/labstack/echo/v4`) — HTTP routing and middleware
  (logger, recover, CORS, request-id).
- **sqlc** — generates typed Go code from hand-written `.sql` queries;
  repositories are thin wrappers around the generated code.
- **pgx** (`github.com/jackc/pgx/v5`) — Postgres driver, used via `pgxpool`
  directly (sqlc supports pgx as a target).
- **golang-migrate** — versioned SQL migrations, applied via a `migrate` CLI
  step (documented in README), not auto-run from application code.
- Configuration via environment variables only (`DATABASE_URL`, `PORT`,
  `ENV`) — no config framework.

Rationale: sqlc keeps SQL explicit and reviewable (helps satisfy the "AI
generates migrations/tables/API logic via prompts" focus called out for the
Backend role in `requirement.md`) while avoiding ORM magic.

## Data Model

### `countries`
| column | type | notes |
|---|---|---|
| id | serial PK | |
| name | text not null | |
| code | text not null unique | ISO-ish short code, e.g. "TR" |

### `tours`
| column | type | notes |
|---|---|---|
| id | serial PK | |
| title | text not null | |
| description | text not null | |
| country_id | int FK → countries.id | |
| price | numeric(10,2) not null | |
| currency | text not null default 'USD' | |
| start_date | date not null | |
| end_date | date not null | |
| duration_days | int not null | |
| category | text | e.g. "beach", "ski" — free-form, no separate table |
| image_url | text | |
| created_at | timestamptz not null default now() | |

### `bookings`
| column | type | notes |
|---|---|---|
| id | serial PK | |
| tour_id | int FK → tours.id | |
| customer_name | text not null | |
| customer_email | text not null | |
| customer_phone | text not null | |
| num_people | int not null, check > 0 | |
| status | text not null default 'pending' | one of pending/confirmed/cancelled |
| created_at | timestamptz not null default now() | |

No availability/seat-count column — deliberately excluded per the
"no overbooking logic" decision above.

## API

Base path: `/api/v1`. JSON in/out throughout.

- `GET /health` → `{"status":"ok"}`
- `GET /countries` → list of `{id, name, code}`
- `GET /tours` — query params, all optional:
  - `country_id` (int)
  - `min_price`, `max_price` (numeric)
  - `date_from`, `date_to` (date, filters tours overlapping the range)
  - `page` (default 1), `limit` (default 20, max 100)
  → `{"items": [...], "page":, "limit":, "total":}`
- `GET /tours/:id` → full tour object, 404 if not found
- `POST /bookings` — body `{tour_id, customer_name, customer_email,
  customer_phone, num_people}`
  - validates: `tour_id` exists (404 if not), email format, phone
    non-empty, `num_people > 0`
  - creates booking with `status = "pending"`
  → 201 with created booking object
- `GET /bookings/:id` → booking object, 404 if not found (no ownership
  check — anonymous lookup by id, acceptable since bookings carry no
  sensitive payment data)

Errors: uniform JSON body `{"error": "message"}` with appropriate HTTP
status (400 malformed input, 404 not found, 422 validation failure, 500
internal), produced by a central `echo.HTTPErrorHandler`.

## Project Structure

```
/cmd/api/main.go              # wiring: config, db pool, echo instance, routes
/internal/config              # env var loading
/internal/handler             # echo handlers + request/response DTOs + validation
/internal/service             # business logic, interfaces over repository
/internal/repository          # sqlc-generated code + repository interfaces
/internal/db/migrations       # golang-migrate .sql files (up/down)
/internal/db/queries          # sqlc .sql source queries
/internal/db/seed             # seed script populating countries + tours
sqlc.yaml
Dockerfile
```

## Testing

Required by the group-project Definition of Done.

- **Unit tests** on the service layer, with hand-written mocks of the
  repository interfaces — cover filter logic and booking validation rules.
- **Integration tests** on handlers using `net/http/httptest` against a real
  Postgres instance (testcontainers-go, or a `DATABASE_URL` pointed at a
  disposable test DB in CI) — cover the full `GET /tours` filter matrix and
  `POST /bookings` happy/invalid paths.

## Deployment

- Multi-stage `Dockerfile`: `golang:1.x` builder stage → minimal runtime
  (`gcr.io/distroless/static` or `alpine`) stage running the compiled
  binary.
- Compatible with Railway's Dockerfile auto-detect (per `requirement.md`
  deploy options: Vercel / Netlify / Railway).
- Postgres is a managed service (e.g. Railway Postgres); the app connects
  via `DATABASE_URL`. Migrations are applied as a separate `migrate` step
  (documented in README), not auto-run on container start.
- No `docker-compose.yml` — local development points at a manually
  configured local or remote Postgres instance via `DATABASE_URL`.

## Open Items for Implementation Plan

None — all decisions above were confirmed during brainstorming. The next
step is `writing-plans` to produce a concrete, ordered implementation plan
from this spec.
