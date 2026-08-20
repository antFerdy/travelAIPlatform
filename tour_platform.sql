-- ============================================================================
-- tour_platform.sql
-- PostgreSQL: complete MVP database for a tour search + booking website
-- Inspired by and seeded from public Kaztour listings.
--
-- Snapshot checked: 2026-08-20
--
-- WHAT THIS FILE SUPPORTS
--   ✓ Tour list
--   ✓ Tour detail page
--   ✓ Filters: country, price, dates (+ optional rating / departure city)
--   ✓ Booking without real payment
--   ✓ AI recommendations by budget, dates and preferences
--   ✓ AI comparison of tours
--
-- DATA ORIGIN
--   scraped = copied from public Kaztour listing data available in search pages
--   demo    = synthetic future offers added only so the demo site keeps working
--             after the scraped departure dates expire
--
-- IMPORTANT
--   This is NOT Kaztour's private/internal database. It is an independent
--   normalized schema built from public site structure and public listing data.
--
-- RUN
--   createdb tour_platform
--   psql -U postgres -d tour_platform -f tour_platform.sql
-- ============================================================================

BEGIN;

DROP VIEW IF EXISTS v_tour_detail CASCADE;
DROP VIEW IF EXISTS v_tour_search CASCADE;

DROP TABLE IF EXISTS booking_traveler CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS tour_exclusion CASCADE;
DROP TABLE IF EXISTS tour_inclusion CASCADE;
DROP TABLE IF EXISTS tour_offer CASCADE;
DROP TABLE IF EXISTS tour_package CASCADE;
DROP TABLE IF EXISTS hotel_amenity CASCADE;
DROP TABLE IF EXISTS hotel_image CASCADE;
DROP TABLE IF EXISTS amenity CASCADE;
DROP TABLE IF EXISTS hotel CASCADE;
DROP TABLE IF EXISTS destination CASCADE;
DROP TABLE IF EXISTS departure_city CASCADE;
DROP TABLE IF EXISTS country CASCADE;

-- ============================================================================
-- 1. GEO / REFERENCE DATA
-- ============================================================================

CREATE TABLE country (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(120) NOT NULL UNIQUE,
    code            CHAR(2) UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE destination (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    country_id          BIGINT NOT NULL REFERENCES country(id) ON DELETE RESTRICT,
    name                VARCHAR(160) NOT NULL,
    destination_type    VARCHAR(30) NOT NULL DEFAULT 'city'
                        CHECK (destination_type IN ('city','resort','district','region','other')),
    description         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(country_id, name)
);

CREATE TABLE departure_city (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    country_id      BIGINT REFERENCES country(id) ON DELETE RESTRICT,
    name            VARCHAR(120) NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. HOTELS
-- ============================================================================

CREATE TABLE hotel (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    destination_id      BIGINT NOT NULL REFERENCES destination(id) ON DELETE RESTRICT,
    name                VARCHAR(220) NOT NULL,
    category            VARCHAR(30),
    rating              NUMERIC(3,2)
                        CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    short_description   VARCHAR(500),
    description         TEXT,
    address             VARCHAR(500),
    source_url          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(destination_id, name)
);

CREATE TABLE hotel_image (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hotel_id        BIGINT NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    alt_text        VARCHAR(300),
    sort_order      SMALLINT NOT NULL DEFAULT 0,
    is_cover        BOOLEAN NOT NULL DEFAULT FALSE,
    data_origin     VARCHAR(20) NOT NULL DEFAULT 'demo'
                    CHECK (data_origin IN ('scraped','demo')),
    UNIQUE(hotel_id, image_url)
);

CREATE TABLE amenity (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(160) NOT NULL UNIQUE,
    category        VARCHAR(80)
);

CREATE TABLE hotel_amenity (
    hotel_id        BIGINT NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
    amenity_id      BIGINT NOT NULL REFERENCES amenity(id) ON DELETE CASCADE,
    PRIMARY KEY (hotel_id, amenity_id)
);

-- ============================================================================
-- 3. TOUR CATALOG
-- ============================================================================

CREATE TABLE tour_package (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hotel_id            BIGINT NOT NULL REFERENCES hotel(id) ON DELETE RESTRICT,
    departure_city_id   BIGINT NOT NULL REFERENCES departure_city(id) ON DELETE RESTRICT,

    slug                VARCHAR(250) NOT NULL UNIQUE,
    title               VARCHAR(250) NOT NULL,
    summary             VARCHAR(600),
    description         TEXT,

    nights              SMALLINT NOT NULL CHECK (nights > 0 AND nights <= 60),
    meal_type           VARCHAR(80),
    room_type           VARCHAR(160),
    transfer_type       VARCHAR(100),
    insurance_included  BOOLEAN NOT NULL DEFAULT TRUE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(hotel_id, departure_city_id, nights, meal_type, room_type)
);

CREATE TABLE tour_inclusion (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tour_package_id     BIGINT NOT NULL REFERENCES tour_package(id) ON DELETE CASCADE,
    item                VARCHAR(250) NOT NULL,
    sort_order          SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE tour_exclusion (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tour_package_id     BIGINT NOT NULL REFERENCES tour_package(id) ON DELETE CASCADE,
    item                VARCHAR(250) NOT NULL,
    sort_order          SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE tour_offer (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tour_package_id     BIGINT NOT NULL REFERENCES tour_package(id) ON DELETE CASCADE,

    departure_date      DATE NOT NULL,
    return_date         DATE NOT NULL,

    adults              SMALLINT NOT NULL DEFAULT 2
                        CHECK (adults > 0 AND adults <= 20),
    children            SMALLINT NOT NULL DEFAULT 0
                        CHECK (children >= 0 AND children <= 20),

    price               NUMERIC(14,2) NOT NULL CHECK (price >= 0),
    currency            CHAR(3) NOT NULL DEFAULT 'KZT',

    available_places    SMALLINT
                        CHECK (available_places IS NULL OR available_places >= 0),

    is_hot              BOOLEAN NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,

    data_origin         VARCHAR(20) NOT NULL
                        CHECK (data_origin IN ('scraped','demo')),
    source_url          TEXT,
    scraped_at          TIMESTAMPTZ,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (return_date > departure_date),
    CHECK (
        (data_origin = 'scraped' AND source_url IS NOT NULL AND scraped_at IS NOT NULL)
        OR
        (data_origin = 'demo')
    )
);

-- ============================================================================
-- 4. BOOKING WITHOUT PAYMENT
-- ============================================================================

CREATE TABLE booking (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_code        VARCHAR(24) NOT NULL UNIQUE,
    tour_offer_id       BIGINT NOT NULL REFERENCES tour_offer(id) ON DELETE RESTRICT,

    customer_name       VARCHAR(180) NOT NULL,
    customer_phone      VARCHAR(40) NOT NULL,
    customer_email      VARCHAR(254),

    adults              SMALLINT NOT NULL CHECK (adults > 0),
    children            SMALLINT NOT NULL DEFAULT 0 CHECK (children >= 0),

    total_price         NUMERIC(14,2) NOT NULL CHECK (total_price >= 0),

    comment             TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','confirmed','cancelled','expired')),

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_traveler (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id          BIGINT NOT NULL REFERENCES booking(id) ON DELETE CASCADE,

    traveler_type       VARCHAR(10) NOT NULL
                        CHECK (traveler_type IN ('adult','child')),

    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    birth_date          DATE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES FOR FILTERS / SEARCH
-- ============================================================================

CREATE INDEX idx_destination_country
    ON destination(country_id);

CREATE INDEX idx_hotel_destination
    ON hotel(destination_id);

CREATE INDEX idx_hotel_rating
    ON hotel(rating);

CREATE INDEX idx_package_departure_city
    ON tour_package(departure_city_id);

CREATE INDEX idx_package_hotel
    ON tour_package(hotel_id);

CREATE INDEX idx_offer_dates
    ON tour_offer(departure_date, return_date);

CREATE INDEX idx_offer_price
    ON tour_offer(price);

CREATE INDEX idx_offer_active
    ON tour_offer(is_active);

CREATE INDEX idx_offer_active_date_price
    ON tour_offer(is_active, departure_date, price);

CREATE INDEX idx_booking_offer
    ON booking(tour_offer_id);

CREATE INDEX idx_booking_status
    ON booking(status);

-- ============================================================================
-- 6. REFERENCE SEED
-- ============================================================================

INSERT INTO country (name, code) VALUES
    ('Казахстан', 'KZ'),
    ('Турция', 'TR'),
    ('ОАЭ', 'AE');

INSERT INTO destination (country_id, name, destination_type, description)
SELECT c.id, v.name, v.destination_type, v.description
FROM (
    VALUES
        ('Турция', 'Стамбул', 'city',
         'Городской отдых, достопримечательности, рестораны и прогулки по историческим районам.'),
        ('Турция', 'Топкапы', 'district',
         'Район Стамбула с удобным доступом к историческому центру.'),
        ('ОАЭ', 'Рас-эль-Хайма', 'resort',
         'Пляжное направление в ОАЭ, подходящее для спокойного и семейного отдыха.')
) AS v(country_name, name, destination_type, description)
JOIN country c ON c.name = v.country_name;

INSERT INTO departure_city (country_id, name)
SELECT c.id, v.name
FROM (VALUES ('Алматы'), ('Астана')) AS v(name)
JOIN country c ON c.name = 'Казахстан';

INSERT INTO amenity (name, category) VALUES
    ('Городской отель', 'hotel_type'),
    ('Ресторан', 'food'),
    ('Бар', 'food'),
    ('Конференц-зал/банкетный зал', 'business'),
    ('Игровая зона в помещении', 'children'),
    ('Сауна, Баня, Хаммам', 'wellness'),
    ('Салон красоты', 'wellness'),
    ('Для пар', 'audience'),
    ('Вид из окна', 'feature'),
    ('Массаж', 'wellness'),
    ('Первая пляжная линия', 'beach'),
    ('Детский клуб', 'children'),
    ('Для семейного отдыха', 'audience');

-- ============================================================================
-- 7. PUBLIC KAZTOUR HOTEL SEED
-- ============================================================================

INSERT INTO hotel (
    destination_id, name, rating, short_description, description, source_url
)
SELECT
    d.id,
    v.hotel_name,
    v.rating,
    v.short_description,
    v.description,
    v.source_url
FROM (
    VALUES
        (
            'Стамбул',
            'Kaya Madrid Hotel',
            NULL::numeric,
            'Городской отель в Стамбуле с рестораном и баром.',
            'Подходит для городского путешествия и знакомства со Стамбулом.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Топкапы',
            'Ulubat Hotel',
            NULL::numeric,
            'Городской вариант размещения в районе Топкапы.',
            'Подходит туристам, которым важна городская локация и доступ к достопримечательностям.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'Hermanos Hotel',
            NULL::numeric,
            'Городской отель с рестораном и wellness-услугами.',
            'Вариант для поездки в Стамбул с дополнительными услугами отдыха.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'Tayhan Hotel',
            4.09,
            'Отель в Стамбуле с рейтингом 4.09.',
            'Городской отель для экскурсионных и коротких поездок.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'Istanbul Royal Hotel',
            4.33,
            'Городской отель с рейтингом 4.33.',
            'Подходит для путешественников, которым важны центральная локация и городской отдых.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'Miklagord',
            NULL::numeric,
            'Городской отель, подходящий для пар.',
            'Базовый вариант для туристической поездки в Стамбул.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'Divas Hotel',
            3.23,
            'Городской отель с рестораном.',
            'Бюджетный вариант размещения для городского путешествия.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'The Lola Hotel',
            3.67,
            'Городской отель в Стамбуле.',
            'Подходит для короткого туристического отдыха.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'Mevlana Hotel',
            5.00,
            'Отель с высоким публичным рейтингом.',
            'Вариант для туристов, которым важны рейтинг и дополнительные услуги.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Стамбул',
            'Grand Ant Hotel',
            4.21,
            'Городской отель с рестораном и баром.',
            'Универсальный вариант для отдыха в Стамбуле.',
            'https://kaztour.kz/s/hot-tours/almaty/turciia'
        ),
        (
            'Рас-эль-Хайма',
            'Hampton by Hilton Marjan Island',
            4.26,
            'Пляжный отель для семей и пар.',
            'Курортный вариант в Рас-эль-Хайме с фокусом на пляжный отдых.',
            'https://kaztour.kz/s/hot-tours/almaty/oae'
        )
) AS v(destination_name, hotel_name, rating, short_description, description, source_url)
JOIN destination d ON d.name = v.destination_name;

-- Demo visuals: generic travel photos, not representations of exact hotel rooms.
INSERT INTO hotel_image (hotel_id, image_url, alt_text, sort_order, is_cover, data_origin)
SELECT
    h.id,
    v.image_url,
    v.alt_text,
    v.sort_order,
    v.is_cover,
    'demo'
FROM (
    VALUES
        ('Kaya Madrid Hotel', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80', 'Travel hotel exterior', 0, TRUE),
        ('Kaya Madrid Hotel', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', 'Hotel room', 1, FALSE),

        ('Ulubat Hotel', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80', 'City hotel', 0, TRUE),
        ('Hermanos Hotel', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 'Hotel building', 0, TRUE),
        ('Tayhan Hotel', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', 'Hotel exterior', 0, TRUE),
        ('Istanbul Royal Hotel', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80', 'Hotel room', 0, TRUE),
        ('Miklagord', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 'Travel accommodation', 0, TRUE),
        ('Divas Hotel', 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80', 'Hotel accommodation', 0, TRUE),
        ('The Lola Hotel', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80', 'Hotel room', 0, TRUE),
        ('Mevlana Hotel', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80', 'Hotel room interior', 0, TRUE),
        ('Grand Ant Hotel', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', 'Hotel and pool', 0, TRUE),

        ('Hampton by Hilton Marjan Island', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', 'Beach resort', 0, TRUE),
        ('Hampton by Hilton Marjan Island', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 'Resort hotel room', 1, FALSE)
) AS v(hotel_name, image_url, alt_text, sort_order, is_cover)
JOIN hotel h ON h.name = v.hotel_name;

-- Amenities observed in public listing cards or used for the demo UX.
INSERT INTO hotel_amenity (hotel_id, amenity_id)
SELECT h.id, a.id
FROM (
    VALUES
        ('Kaya Madrid Hotel', 'Городской отель'),
        ('Kaya Madrid Hotel', 'Ресторан'),
        ('Kaya Madrid Hotel', 'Бар'),

        ('Ulubat Hotel', 'Конференц-зал/банкетный зал'),
        ('Ulubat Hotel', 'Игровая зона в помещении'),

        ('Hermanos Hotel', 'Ресторан'),
        ('Hermanos Hotel', 'Сауна, Баня, Хаммам'),
        ('Hermanos Hotel', 'Салон красоты'),

        ('Tayhan Hotel', 'Ресторан'),
        ('Tayhan Hotel', 'Конференц-зал/банкетный зал'),
        ('Tayhan Hotel', 'Городской отель'),

        ('Istanbul Royal Hotel', 'Ресторан'),
        ('Istanbul Royal Hotel', 'Конференц-зал/банкетный зал'),
        ('Istanbul Royal Hotel', 'Городской отель'),

        ('Miklagord', 'Городской отель'),
        ('Miklagord', 'Для пар'),

        ('Divas Hotel', 'Ресторан'),
        ('Divas Hotel', 'Вид из окна'),
        ('Divas Hotel', 'Городской отель'),

        ('The Lola Hotel', 'Городской отель'),
        ('The Lola Hotel', 'Ресторан'),

        ('Mevlana Hotel', 'Ресторан'),
        ('Mevlana Hotel', 'Массаж'),
        ('Mevlana Hotel', 'Городской отель'),

        ('Grand Ant Hotel', 'Ресторан'),
        ('Grand Ant Hotel', 'Бар'),

        ('Hampton by Hilton Marjan Island', 'Первая пляжная линия'),
        ('Hampton by Hilton Marjan Island', 'Детский клуб'),
        ('Hampton by Hilton Marjan Island', 'Ресторан'),
        ('Hampton by Hilton Marjan Island', 'Для семейного отдыха'),
        ('Hampton by Hilton Marjan Island', 'Для пар')
) AS v(hotel_name, amenity_name)
JOIN hotel h ON h.name = v.hotel_name
JOIN amenity a ON a.name = v.amenity_name;

-- ============================================================================
-- 8. TOUR PACKAGES
-- ============================================================================

INSERT INTO tour_package (
    hotel_id,
    departure_city_id,
    slug,
    title,
    summary,
    description,
    nights,
    meal_type,
    room_type,
    transfer_type,
    insurance_included
)
SELECT
    h.id,
    dc.id,
    v.slug,
    v.title,
    v.summary,
    v.description,
    v.nights,
    v.meal_type,
    v.room_type,
    v.transfer_type,
    TRUE
FROM (
    VALUES
        ('Kaya Madrid Hotel', 'Алматы', 'istanbul-kaya-madrid-9n-almaty',
         'Стамбул: Kaya Madrid Hotel, 9 ночей',
         'Городской тур в Стамбул для двух взрослых.',
         'Подходит для туристов, которые хотят исследовать Стамбул и жить в городском отеле.',
         9, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Ulubat Hotel', 'Алматы', 'istanbul-ulubat-9n-almaty',
         'Стамбул: Ulubat Hotel, 9 ночей',
         'Бюджетный городской тур в район Топкапы.',
         'Практичный вариант для экскурсионной поездки и знакомства со Стамбулом.',
         9, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Hermanos Hotel', 'Алматы', 'istanbul-hermanos-9n-almaty',
         'Стамбул: Hermanos Hotel, 9 ночей',
         'Городской тур с wellness-опциями.',
         'Подходит тем, кто хочет совместить экскурсии и отдых в отеле.',
         9, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Tayhan Hotel', 'Алматы', 'istanbul-tayhan-9n-almaty',
         'Стамбул: Tayhan Hotel, 9 ночей',
         'Городской тур с отелем рейтинга 4.09.',
         'Хороший баланс цены и публичного рейтинга отеля.',
         9, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Istanbul Royal Hotel', 'Алматы', 'istanbul-royal-9n-almaty',
         'Стамбул: Istanbul Royal Hotel, 9 ночей',
         'Городской тур с отелем рейтинга 4.33.',
         'Подходит путешественникам, которым важен более высокий рейтинг отеля.',
         9, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Miklagord', 'Алматы', 'istanbul-miklagord-7n-almaty',
         'Стамбул: Miklagord, 7 ночей',
         'Короткий городской тур для двух взрослых.',
         'Подходит для недельного city-break в Стамбуле.',
         7, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Divas Hotel', 'Алматы', 'istanbul-divas-7n-almaty',
         'Стамбул: Divas Hotel, 7 ночей',
         'Бюджетный недельный тур.',
         'Вариант для туристов, у которых цена важнее рейтинга отеля.',
         7, 'Завтрак', 'Standard Room', 'Групповой'),

        ('The Lola Hotel', 'Алматы', 'istanbul-lola-7n-almaty',
         'Стамбул: The Lola Hotel, 7 ночей',
         'Недельный городской тур.',
         'Базовый вариант для отдыха и экскурсий по Стамбулу.',
         7, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Mevlana Hotel', 'Алматы', 'istanbul-mevlana-7n-almaty',
         'Стамбул: Mevlana Hotel, 7 ночей',
         'Недельный тур с отелем высокого публичного рейтинга.',
         'Подходит туристам, которые сравнивают предложения прежде всего по рейтингу.',
         7, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Grand Ant Hotel', 'Алматы', 'istanbul-grand-ant-9n-almaty',
         'Стамбул: Grand Ant Hotel, 9 ночей',
         'Городской тур с рестораном и баром.',
         'Универсальный пакет для поездки в Стамбул.',
         9, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Hampton by Hilton Marjan Island', 'Алматы', 'uae-hampton-marjan-7n-almaty',
         'ОАЭ: Hampton by Hilton Marjan Island, 7 ночей',
         'Пляжный тур из Алматы для семей и пар.',
         'Подходит для пляжного отдыха в Рас-эль-Хайме.',
         7, 'Завтрак', 'Standard Room', 'Групповой'),

        ('Hampton by Hilton Marjan Island', 'Астана', 'uae-hampton-marjan-7n-astana',
         'ОАЭ: Hampton by Hilton Marjan Island, 7 ночей из Астаны',
         'Пляжный тур из Астаны для семей и пар.',
         'Подходит для пляжного отдыха в Рас-эль-Хайме.',
         7, 'Завтрак', 'Standard Room', 'Групповой')
) AS v(
    hotel_name, departure_city, slug, title, summary, description,
    nights, meal_type, room_type, transfer_type
)
JOIN hotel h ON h.name = v.hotel_name
JOIN departure_city dc ON dc.name = v.departure_city;

-- Common inclusions for MVP tour detail page.
INSERT INTO tour_inclusion (tour_package_id, item, sort_order)
SELECT tp.id, v.item, v.sort_order
FROM tour_package tp
CROSS JOIN (
    VALUES
        ('Перелёт туда и обратно', 1),
        ('Проживание в отеле', 2),
        ('Питание согласно тарифу', 3),
        ('Трансфер аэропорт — отель — аэропорт', 4),
        ('Базовая туристическая страховка', 5)
) AS v(item, sort_order);

INSERT INTO tour_exclusion (tour_package_id, item, sort_order)
SELECT tp.id, v.item, v.sort_order
FROM tour_package tp
CROSS JOIN (
    VALUES
        ('Личные расходы', 1),
        ('Экскурсии, не включённые в программу', 2),
        ('Дополнительные услуги отеля', 3)
) AS v(item, sort_order);

-- ============================================================================
-- 9. SCRAPED PUBLIC OFFERS
--    These dates are preserved as historical public snapshots.
-- ============================================================================

INSERT INTO tour_offer (
    tour_package_id,
    departure_date,
    return_date,
    adults,
    children,
    price,
    currency,
    available_places,
    is_hot,
    is_active,
    data_origin,
    source_url,
    scraped_at
)
SELECT
    tp.id,
    v.departure_date,
    v.departure_date + tp.nights,
    2,
    0,
    v.price,
    'KZT',
    NULL,
    TRUE,
    FALSE,
    'scraped',
    v.source_url,
    TIMESTAMPTZ '2026-08-20 19:50:00+05'
FROM (
    VALUES
        ('istanbul-kaya-madrid-9n-almaty', DATE '2026-08-18', 728973::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-ulubat-9n-almaty', DATE '2026-08-18', 731169::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-hermanos-9n-almaty', DATE '2026-08-18', 733914::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-tayhan-9n-almaty', DATE '2026-08-18', 753678::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-royal-9n-almaty', DATE '2026-08-18', 764658::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-miklagord-7n-almaty', DATE '2026-08-18', 770882::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-divas-7n-almaty', DATE '2026-08-18', 775145::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-lola-7n-almaty', DATE '2026-08-18', 775145::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-mevlana-7n-almaty', DATE '2026-08-18', 778383::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('istanbul-grand-ant-9n-almaty', DATE '2026-08-18', 790461::numeric, 'https://kaztour.kz/ru/s/hot-tours/all'),
        ('uae-hampton-marjan-7n-almaty', DATE '2026-08-19', 728856::numeric, 'https://kaztour.kz/s/hot-tours/almaty/oae'),
        ('uae-hampton-marjan-7n-astana', DATE '2026-08-19', 731912::numeric, 'https://kaztour.kz/s/hot-tours/all')
) AS v(slug, departure_date, price, source_url)
JOIN tour_package tp ON tp.slug = v.slug;

-- ============================================================================
-- 10. FUTURE DEMO OFFERS
--     Synthetic data for frontend/backend testing.
--     These are deliberately marked data_origin='demo'.
-- ============================================================================

WITH demo_dates(departure_date, date_multiplier) AS (
    VALUES
        (DATE '2026-09-05', 1.00::numeric),
        (DATE '2026-09-12', 1.04::numeric),
        (DATE '2026-09-20', 0.97::numeric),
        (DATE '2026-10-03', 1.08::numeric)
),
base_prices(slug, base_price, places) AS (
    VALUES
        ('istanbul-kaya-madrid-9n-almaty', 735000::numeric, 8),
        ('istanbul-ulubat-9n-almaty', 710000::numeric, 6),
        ('istanbul-hermanos-9n-almaty', 760000::numeric, 9),
        ('istanbul-tayhan-9n-almaty', 785000::numeric, 7),
        ('istanbul-royal-9n-almaty', 820000::numeric, 5),
        ('istanbul-miklagord-7n-almaty', 690000::numeric, 11),
        ('istanbul-divas-7n-almaty', 665000::numeric, 10),
        ('istanbul-lola-7n-almaty', 680000::numeric, 12),
        ('istanbul-mevlana-7n-almaty', 805000::numeric, 4),
        ('istanbul-grand-ant-9n-almaty', 795000::numeric, 6),
        ('uae-hampton-marjan-7n-almaty', 845000::numeric, 7),
        ('uae-hampton-marjan-7n-astana', 875000::numeric, 5)
)
INSERT INTO tour_offer (
    tour_package_id,
    departure_date,
    return_date,
    adults,
    children,
    price,
    currency,
    available_places,
    is_hot,
    is_active,
    data_origin,
    source_url,
    scraped_at
)
SELECT
    tp.id,
    dd.departure_date,
    dd.departure_date + tp.nights,
    2,
    0,
    ROUND(bp.base_price * dd.date_multiplier, 0),
    'KZT',
    GREATEST(bp.places - ((EXTRACT(DAY FROM dd.departure_date)::int) % 3), 1),
    (dd.departure_date IN (DATE '2026-09-05', DATE '2026-09-20')),
    TRUE,
    'demo',
    NULL,
    NULL
FROM base_prices bp
JOIN tour_package tp ON tp.slug = bp.slug
CROSS JOIN demo_dates dd;

-- ============================================================================
-- 11. SEARCH VIEW
--     Use for the list page, filters and AI retrieval.
-- ============================================================================

CREATE VIEW v_tour_search AS
SELECT
    o.id AS offer_id,
    tp.id AS tour_package_id,
    tp.slug,
    tp.title,
    tp.summary,

    c.id AS country_id,
    c.name AS country,

    d.id AS destination_id,
    d.name AS destination,

    dc.id AS departure_city_id,
    dc.name AS departure_city,

    h.id AS hotel_id,
    h.name AS hotel,
    h.category AS hotel_category,
    h.rating AS hotel_rating,

    (
        SELECT hi.image_url
        FROM hotel_image hi
        WHERE hi.hotel_id = h.id
        ORDER BY hi.is_cover DESC, hi.sort_order ASC, hi.id ASC
        LIMIT 1
    ) AS cover_image_url,

    tp.nights,
    tp.meal_type,
    tp.room_type,

    o.departure_date,
    o.return_date,
    o.adults,
    o.children,

    o.price,
    o.currency,

    o.available_places,
    o.is_hot,
    o.is_active,
    o.data_origin,

    ARRAY(
        SELECT a.name
        FROM hotel_amenity ha
        JOIN amenity a ON a.id = ha.amenity_id
        WHERE ha.hotel_id = h.id
        ORDER BY a.name
    ) AS amenities

FROM tour_offer o
JOIN tour_package tp ON tp.id = o.tour_package_id
JOIN hotel h ON h.id = tp.hotel_id
JOIN destination d ON d.id = h.destination_id
JOIN country c ON c.id = d.country_id
JOIN departure_city dc ON dc.id = tp.departure_city_id;

COMMENT ON VIEW v_tour_search IS
'List/filter/AI-friendly view. Query this instead of joining the whole schema in the frontend API.';

-- ============================================================================
-- 12. DETAIL VIEW
--     Use for GET /tours/:slug?offerId=...
-- ============================================================================

CREATE VIEW v_tour_detail AS
SELECT
    s.*,

    h.short_description AS hotel_short_description,
    h.description AS hotel_description,
    tp.description AS tour_description,
    tp.transfer_type,
    tp.insurance_included,

    ARRAY(
        SELECT hi.image_url
        FROM hotel_image hi
        WHERE hi.hotel_id = s.hotel_id
        ORDER BY hi.is_cover DESC, hi.sort_order ASC, hi.id ASC
    ) AS image_urls,

    ARRAY(
        SELECT ti.item
        FROM tour_inclusion ti
        WHERE ti.tour_package_id = s.tour_package_id
        ORDER BY ti.sort_order, ti.id
    ) AS included,

    ARRAY(
        SELECT te.item
        FROM tour_exclusion te
        WHERE te.tour_package_id = s.tour_package_id
        ORDER BY te.sort_order, te.id
    ) AS excluded

FROM v_tour_search s
JOIN tour_package tp ON tp.id = s.tour_package_id
JOIN hotel h ON h.id = s.hotel_id;

COMMENT ON VIEW v_tour_detail IS
'Tour detail page view including images, inclusions and exclusions.';

-- ============================================================================
-- 13. READY-TO-USE API QUERIES
-- ============================================================================

-- A) TOUR LIST
-- SELECT *
-- FROM v_tour_search
-- WHERE is_active = TRUE
-- ORDER BY is_hot DESC, price ASC;

-- B) FILTER: country + price + dates
-- SELECT *
-- FROM v_tour_search
-- WHERE is_active = TRUE
--   AND country = 'Турция'
--   AND price BETWEEN 600000 AND 800000
--   AND departure_date BETWEEN DATE '2026-09-01' AND DATE '2026-09-30'
-- ORDER BY price ASC;

-- C) TOUR DETAIL
-- SELECT *
-- FROM v_tour_detail
-- WHERE slug = 'istanbul-kaya-madrid-9n-almaty'
--   AND offer_id = 13;

-- D) AI: find options within budget and explain differences
-- SELECT
--     offer_id,
--     title,
--     country,
--     destination,
--     hotel,
--     hotel_rating,
--     nights,
--     meal_type,
--     price,
--     departure_date,
--     amenities
-- FROM v_tour_search
-- WHERE is_active = TRUE
--   AND departure_date BETWEEN DATE '2026-09-01' AND DATE '2026-09-30'
--   AND price <= 800000
-- ORDER BY hotel_rating DESC NULLS LAST, price ASC
-- LIMIT 5;

-- E) CREATE BOOKING WITHOUT PAYMENT
-- INSERT INTO booking (
--     booking_code,
--     tour_offer_id,
--     customer_name,
--     customer_phone,
--     customer_email,
--     adults,
--     children,
--     total_price,
--     comment,
--     status
-- )
-- SELECT
--     'BK-2026-000001',
--     o.id,
--     'Demo User',
--     '+7 700 000 00 00',
--     'demo@example.com',
--     o.adults,
--     o.children,
--     o.price,
--     'Please contact me by phone',
--     'pending'
-- FROM tour_offer o
-- WHERE o.id = 13;

-- ============================================================================
-- 14. SANITY CHECKS
-- ============================================================================

-- Must return 12 packages:
-- SELECT COUNT(*) FROM tour_package;

-- Must return 48 active future demo offers:
-- SELECT COUNT(*) FROM tour_offer
-- WHERE data_origin = 'demo' AND is_active = TRUE;

-- Should return countries available for frontend filter:
-- SELECT DISTINCT country FROM v_tour_search WHERE is_active = TRUE ORDER BY country;

-- Should return min/max prices for slider:
-- SELECT MIN(price), MAX(price) FROM v_tour_search WHERE is_active = TRUE;

COMMIT;
