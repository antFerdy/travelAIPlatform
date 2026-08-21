# Tours Backend

Go + Echo + PostgreSQL backend for the tour-sales platform. Spec:
`../docs/superpowers/specs/2026-08-20-tours-backend-design.md`.
Full API contract (request/response shapes, validation, error codes):
[`api.md`](./api.md).

## Local setup

Full stack (Postgres + API + ai-service + frontend) via Docker Compose —
see the root [`docker-compose.yml`](../docker-compose.yml) and
[root README](../README.md#docker-compose-полный-стек). Run from the repo
root, not from here:

```bash
cd ..
cp .env.example .env           # OPENAI_API_KEY, needed by ai-service
docker compose up -d --build   # Postgres :5432, API :8080, ai-service :8000, frontend :5173

# apply schema (first run only)
docker exec -i tours-postgres psql -U tours -d tours -v ON_ERROR_STOP=1 \
  < backend/internal/db/migrations/0001_init_schema.up.sql

# load seed data (countries + tours, derived from tour_platform.sql)
docker exec -i tours-postgres psql -U tours -d tours -v ON_ERROR_STOP=1 \
  < backend/internal/db/seed/seed.sql

docker compose restart api   # picks up the freshly seeded schema
```

Or run just the API natively against a dockerized Postgres only (from the
repo root: `docker compose up -d postgres`, apply schema/seed as above using
the `backend/internal/db/...` paths, then from `backend/`):

```bash
DATABASE_URL="postgres://tours:tours@localhost:5432/tours?sslmode=disable" \
  go run ./cmd/api
```

API listens on `:8080` (override with `PORT`).

## API examples

```bash
curl http://localhost:8080/health
```
```json
{"status":"ok"}
```

```bash
curl http://localhost:8080/api/v1/countries
```
```json
[{"id":1,"name":"ОАЭ","code":"AE"},{"id":2,"name":"Турция","code":"TR"}]
```

```bash
curl "http://localhost:8080/api/v1/tours?country_id=2&min_price=600000&max_price=800000&date_from=2026-09-01&date_to=2026-09-30&limit=2"
```
```json
{
  "items": [
    {
      "id": 5,
      "title": "Стамбул: Kaya Madrid Hotel, 9 ночей",
      "description": "Подходит для туристов, которые хотят исследовать Стамбул и жить в городском отеле. Отель: Kaya Madrid Hotel. Городской отель в Стамбуле с рестораном и баром.",
      "country_id": 2,
      "price": 735000,
      "currency": "KZT",
      "start_date": "2026-09-05",
      "end_date": "2026-09-14",
      "duration_days": 9,
      "category": "city",
      "image_url": "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
      "created_at": "2026-08-20T15:51:12Z"
    }
  ],
  "page": 1,
  "limit": 2,
  "total": 24
}
```

```bash
curl http://localhost:8080/api/v1/tours/5
```
```json
{"id":5,"title":"Стамбул: Kaya Madrid Hotel, 9 ночей","country_id":2,"price":735000,"currency":"KZT","start_date":"2026-09-05","end_date":"2026-09-14","duration_days":9,"category":"city","...":"..."}
```

```bash
curl -X POST http://localhost:8080/api/v1/bookings \
  -H "Content-Type: application/json" \
  -d '{"tour_id":5,"customer_name":"Ivan Petrov","customer_email":"ivan@example.com","customer_phone":"+77001234567","num_people":2}'
```
```json
{"id":1,"tour_id":5,"customer_name":"Ivan Petrov","customer_email":"ivan@example.com","customer_phone":"+77001234567","num_people":2,"status":"pending","created_at":"2026-08-20T16:12:08Z"}
```

```bash
curl http://localhost:8080/api/v1/bookings/1
```
```json
{"id":1,"tour_id":5,"customer_name":"Ivan Petrov","customer_email":"ivan@example.com","customer_phone":"+77001234567","num_people":2,"status":"pending","created_at":"2026-08-20T16:12:08Z"}
```

```bash
curl -i http://localhost:8080/api/v1/tours/9999
```
```
HTTP/1.1 404 Not Found
{"error":"tour 9999 not found"}
```

## Tests

Unit tests (service layer, mocked repository) run with no setup:

```bash
go test ./internal/service/...
```

Integration tests (real Postgres, full HTTP router) need a disposable test
database:

```bash
docker exec tours-postgres psql -U tours -d tours -c "CREATE DATABASE tours_test;"
docker exec -i tours-postgres psql -U tours -d tours_test -v ON_ERROR_STOP=1 \
  < internal/db/migrations/0001_init_schema.up.sql

TEST_DATABASE_URL="postgres://tours:tours@localhost:5432/tours_test?sslmode=disable" \
  go test ./...
```

Integration tests are skipped automatically if `TEST_DATABASE_URL` is unset.

## Regenerating repository code

Query files live in `internal/db/queries`; generated code in
`internal/repository` is produced by [sqlc](https://sqlc.dev):

```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
sqlc generate
```

## Docker image

Built automatically as the `api` service by the root `docker-compose.yml`.
To build/run it standalone (from this directory):

```bash
docker build -t tours-backend .
docker run -p 8080:8080 -e DATABASE_URL=... tours-backend
```
