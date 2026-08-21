# Test Issue: `./tests` suite fails 12/12 — selectors don't exist in the frontend

## Title
[QA/Frontend] Root-level Playwright suite (`./tests`) uses `data-testid`
selectors that are not present anywhere in `frontend/src`

## Environment
Local — full stack via root `docker-compose.yml` (postgres + api + ai-service
+ frontend), frontend served on `http://localhost:5173`, backend on `:8080`
with seed data loaded (48 tours, 2 countries).

## Summary

Running the root Playwright suite against the real, running stack fails
**12 out of 12 tests**. This is not a product bug — the backend and frontend
both work correctly (verified manually via curl and Playwright MCP browser
navigation). The suite fails because every spec queries elements via
`page.getByTestId(...)`, and `frontend/src` does not contain a single
`data-testid` attribute:

```bash
grep -rn "testid\|testId" frontend/src   # zero matches
```

This suite (added in commit `test: add initial AI-assisted QA automation
setup`) appears to have been scaffolded against an assumed component API
before/independently of the actual frontend implementation, and was never
reconciled with it. It is a different, unrelated suite from
`frontend/e2e/`, which targets the real DOM (CSS/role selectors) and passes
as part of `npm run test:e2e` (see root `README.md` → Тесты).

## Preconditions

1. Full stack running: `docker compose up -d --build` from repo root, with
   `backend/internal/db/migrations/0001_init_schema.up.sql` and
   `backend/internal/db/seed/seed.sql` applied to `tours-postgres`.
2. Frontend dependencies installed once (`cd frontend && npm install`) —
   the root suite has no `package.json`/lockfile of its own and currently
   has to borrow `@playwright/test` from `frontend/node_modules` (see
   "Additional friction" below).

## Steps to reproduce

```bash
cd frontend && npm install         # installs @playwright/test, one-time
cd ..
ln -s frontend/node_modules node_modules   # root has no node_modules of its own
BASE_URL=http://localhost:5173 ./node_modules/.bin/playwright test
```

## Expected

Tests interact with real catalogue/booking/filter/AI-chat UI and pass
(or fail on genuine product defects).

## Actual

All 12 tests fail with `element(s) not found` / timeout waiting for a
`data-testid` locator, e.g.:

```
Error: expect(locator).toBeVisible() failed
Locator: getByTestId('tour-card').first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

Failing specs (12/12):
- `tests/ai-assistant.spec.ts:4` — recommends tours based on budget and dates
- `tests/booking.spec.ts:10` — completes booking successfully
- `tests/booking.spec.ts:21` — validates required booking fields
- `tests/booking.spec.ts:28` — validates invalid email
- `tests/filters.spec.ts:8` — filters tours by country
- `tests/filters.spec.ts:22` — filters tours by maximum price
- `tests/filters.spec.ts:38` — filters tours by dates
- `tests/filters.spec.ts:46` — shows empty state when nothing matches filters
- `tests/resilience.spec.ts:4` — website remains usable when AI API is unavailable
- `tests/resilience.spec.ts:24` — shows safe error state when backend returns an error
- `tests/tours.spec.ts:8` — displays available tours
- `tests/tours.spec.ts:16` — opens tour details page

## Severity
Medium — no product regression (verified backend + frontend work correctly
outside this suite), but this suite currently provides zero real coverage
and would give a false sense of "12 QA scenarios covered" if not flagged.

## Additional friction (separate from the selector mismatch)

- No `package.json` at repo root for `./tests` / root `playwright.config.ts`
  — running the suite requires manually installing `@playwright/test`
  (currently borrowed from `frontend/node_modules` via a symlink, which is
  not committed and not a real fix).
- `playwright.config.ts` `use.baseURL` defaults to `http://localhost:3000`,
  which matches neither the frontend dev server (`:5173`) nor the
  docker-compose frontend (`:5173`) nor the backend (`:8080`) — must be
  overridden with `BASE_URL` every run.

## Suggested fix (pick one, needs frontend/QA role owner)

1. Add `data-testid` attributes to the relevant frontend components
   matching what these specs expect (`tour-card`, `tour-details`,
   `book-tour-button`, `booking-name/email/phone`, `booking-submit`,
   `booking-success`, `booking-error`, `booking-email-error`,
   `country-filter`, `max-price-filter`, `date-from-filter`,
   `date-to-filter`, `apply-filters`, `tour-price`, `tour-results`,
   `empty-state`, `api-error-state`, `ai-chat`, `ai-chat-input`,
   `ai-chat-send`, `ai-chat-response`), **or**
2. Rewrite `tests/*.spec.ts` to target the frontend's actual selectors
   (roles/text/CSS, same approach `frontend/e2e/` already uses).

Either way, also give `./tests` its own `package.json` (or fold it into
`frontend/e2e/`) and fix the default `baseURL` so the suite is runnable
without tribal knowledge.
