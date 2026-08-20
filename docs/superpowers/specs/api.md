# API Contract — Tours Backend

Base URL (local): `http://localhost:8080`
All endpoints are under `/api/v1` except `/health`.
All requests/responses are JSON, `Content-Type: application/json; charset=UTF-8`.
No authentication — booking is anonymous per the platform design (see
`docs/superpowers/specs/2026-08-20-tours-backend-design.md`).

## Conventions

### Error format

Every non-2xx response body has the shape:

```json
{ "error": "human-readable message" }
```

| Status | Meaning                                           |
|--------|----------------------------------------------------|
| 404    | Resource not found (tour or booking id)             |
| 422    | Request failed validation (bad query param, bad body) |
| 500    | Unexpected server/database error                    |

### Dates

All dates are `YYYY-MM-DD` (no time component). Timestamps
(`created_at`) are RFC 3339, e.g. `2026-08-20T16:12:08Z`.

### Money

`price` is a JSON number with 2 decimal places of precision (source data is
in KZT; `currency` on each tour tells you which). No payment is processed —
booking is a request record only.

---

## `GET /health`

Liveness probe.

**Response `200`**
```json
{ "status": "ok" }
```

---

## `GET /api/v1/countries`

List all countries that have at least one tour. No query parameters.

**Response `200`**
```json
[
  { "id": 1, "name": "ОАЭ", "code": "AE" },
  { "id": 2, "name": "Турция", "code": "TR" }
]
```

| Field | Type   | Notes            |
|-------|--------|-------------------|
| id    | int    |                   |
| name  | string |                   |
| code  | string | ISO-ish 2-letter code |

---

## `GET /api/v1/tours`

List tours with optional filters and pagination.

### Query parameters

| Param       | Type   | Required | Default | Notes |
|-------------|--------|----------|---------|-------|
| country_id  | int    | no       | —       | exact match against `tours.country_id` |
| min_price   | number | no       | —       | inclusive lower bound on `price` |
| max_price   | number | no       | —       | inclusive upper bound on `price` |
| date_from   | date   | no       | —       | `YYYY-MM-DD`; matches tours whose `end_date >= date_from` |
| date_to     | date   | no       | —       | `YYYY-MM-DD`; matches tours whose `start_date <= date_to` |
| page        | int    | no       | `1`     | 1-indexed |
| limit       | int    | no       | `20`    | clamped to `100` max |

`date_from`/`date_to` together select tours whose `[start_date, end_date]`
range **overlaps** the requested range (not tours fully contained in it).

Any malformed value (non-numeric `country_id`/`min_price`/`max_price`,
non-parseable date, `page < 1`, `limit < 1`) → `422`.

### Response `200`

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

| Field  | Type       | Notes                                  |
|--------|------------|------------------------------------------|
| items  | Tour[]     | see [Tour object](#tour-object) below     |
| page   | int        | echoes the requested (or default) page   |
| limit  | int        | echoes the requested (or default/clamped) limit |
| total  | int        | total matching rows across all pages     |

### Tour object

| Field         | Type            | Notes |
|---------------|-----------------|-------|
| id            | int             |       |
| title         | string          |       |
| description   | string          |       |
| country_id    | int             | FK to `/countries` |
| price         | number          |       |
| currency      | string          | e.g. `"KZT"` |
| start_date    | string (date)   |       |
| end_date      | string (date)   |       |
| duration_days | int             | nights |
| category      | string          | e.g. `"beach"`, `"city"`; omitted if empty |
| image_url     | string          | omitted if empty |
| created_at    | string (RFC3339)|       |

---

## `GET /api/v1/tours/:id`

Fetch a single tour.

**Path param:** `id` (int)

**Response `200`** — a single [Tour object](#tour-object)

**Response `404`**
```json
{ "error": "tour 9999 not found" }
```

---

## `POST /api/v1/bookings`

Create an anonymous booking request for a tour. No payment, no
availability/seat check — this always succeeds if the tour exists and the
body is valid.

### Request body

```json
{
  "tour_id": 5,
  "customer_name": "Ivan Petrov",
  "customer_email": "ivan@example.com",
  "customer_phone": "+77001234567",
  "num_people": 2
}
```

| Field          | Type   | Required | Validation |
|----------------|--------|----------|------------|
| tour_id        | int    | yes      | must reference an existing tour |
| customer_name  | string | yes      | non-empty |
| customer_email | string | yes      | must be a valid email address |
| customer_phone | string | yes      | non-empty (no format check) |
| num_people     | int    | yes      | `> 0` |

### Response `201`

```json
{
  "id": 1,
  "tour_id": 5,
  "customer_name": "Ivan Petrov",
  "customer_email": "ivan@example.com",
  "customer_phone": "+77001234567",
  "num_people": 2,
  "status": "pending",
  "created_at": "2026-08-20T16:12:08Z"
}
```

`status` is always `"pending"` on creation (no confirmation flow exists
yet). Possible values in the data model: `pending`, `confirmed`, `cancelled`.

### Error responses

| Status | Cause | Body |
|--------|-------|------|
| 422 | missing/invalid field (e.g. bad email, `num_people <= 0`, missing name) | `{ "error": "validation failed: Key: 'CreateBookingRequest.CustomerEmail' Error:Field validation for 'CustomerEmail' failed on the 'email' tag" }` |
| 422 | malformed JSON body | `{ "error": "invalid request body" }` |
| 404 | `tour_id` does not exist | `{ "error": "tour 99999 not found" }` |

---

## `GET /api/v1/bookings/:id`

Fetch a booking by id. No ownership check — anyone with the id can look it
up (acceptable: bookings carry no payment data, by design).

**Path param:** `id` (int)

**Response `200`** — a single Booking object (same shape as the `POST`
response body)

**Response `404`**
```json
{ "error": "booking 42 not found" }
```

---

## Summary

| Method | Path                    | Body               | Success | Errors    |
|--------|--------------------------|--------------------|---------|-----------|
| GET    | `/health`                 | —                  | 200     | —         |
| GET    | `/api/v1/countries`       | —                  | 200     | —         |
| GET    | `/api/v1/tours`           | — (query filters)  | 200     | 422       |
| GET    | `/api/v1/tours/:id`       | —                  | 200     | 404       |
| POST   | `/api/v1/bookings`        | CreateBookingRequest | 201  | 404, 422  |
| GET    | `/api/v1/bookings/:id`    | —                  | 200     | 404       |
