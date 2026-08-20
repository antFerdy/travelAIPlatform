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