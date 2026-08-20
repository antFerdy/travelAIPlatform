-- name: ListTours :many
SELECT *
FROM tours
WHERE
  (sqlc.narg('country_id')::int IS NULL OR country_id = sqlc.narg('country_id'))
  AND (sqlc.narg('min_price')::numeric IS NULL OR price >= sqlc.narg('min_price'))
  AND (sqlc.narg('max_price')::numeric IS NULL OR price <= sqlc.narg('max_price'))
  AND (sqlc.narg('date_from')::date IS NULL OR end_date >= sqlc.narg('date_from'))
  AND (sqlc.narg('date_to')::date IS NULL OR start_date <= sqlc.narg('date_to'))
ORDER BY start_date ASC, id ASC
LIMIT sqlc.arg('limit')
OFFSET sqlc.arg('offset');

-- name: CountTours :one
SELECT count(*)
FROM tours
WHERE
  (sqlc.narg('country_id')::int IS NULL OR country_id = sqlc.narg('country_id'))
  AND (sqlc.narg('min_price')::numeric IS NULL OR price >= sqlc.narg('min_price'))
  AND (sqlc.narg('max_price')::numeric IS NULL OR price <= sqlc.narg('max_price'))
  AND (sqlc.narg('date_from')::date IS NULL OR end_date >= sqlc.narg('date_from'))
  AND (sqlc.narg('date_to')::date IS NULL OR start_date <= sqlc.narg('date_to'));

-- name: GetTour :one
SELECT * FROM tours WHERE id = $1;
