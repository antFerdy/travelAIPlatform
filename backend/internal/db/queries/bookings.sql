-- name: TourExists :one
SELECT EXISTS(SELECT 1 FROM tours WHERE id = $1);

-- name: CreateBooking :one
INSERT INTO bookings (tour_id, customer_name, customer_email, customer_phone, num_people)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetBooking :one
SELECT * FROM bookings WHERE id = $1;
