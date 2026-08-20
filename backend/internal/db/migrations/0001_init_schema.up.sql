CREATE TABLE countries (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE
);

CREATE TABLE tours (
    id             SERIAL PRIMARY KEY,
    title          TEXT NOT NULL,
    description    TEXT NOT NULL,
    country_id     INTEGER NOT NULL REFERENCES countries(id),
    price          NUMERIC(10, 2) NOT NULL,
    currency       TEXT NOT NULL DEFAULT 'USD',
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    duration_days  INTEGER NOT NULL,
    category       TEXT,
    image_url      TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tours_country_id ON tours(country_id);
CREATE INDEX idx_tours_price ON tours(price);
CREATE INDEX idx_tours_dates ON tours(start_date, end_date);

CREATE TABLE bookings (
    id             SERIAL PRIMARY KEY,
    tour_id        INTEGER NOT NULL REFERENCES tours(id),
    customer_name  TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    num_people     INTEGER NOT NULL CHECK (num_people > 0),
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_tour_id ON bookings(tour_id);
