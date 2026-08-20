package app_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"

	"travelaiplatform/backend/internal/app"
	"travelaiplatform/backend/internal/dto"
	"travelaiplatform/backend/internal/repository"
	"travelaiplatform/backend/internal/testutil"
)

// seedFixture inserts 2 countries and 3 tours covering distinct price/date/
// country combinations, used to exercise the GET /tours filter matrix.
func seedFixture(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	ctx := context.Background()

	_, err := pool.Exec(ctx, `
		INSERT INTO countries (id, name, code) VALUES
			(1, 'Турция', 'TR'),
			(2, 'ОАЭ', 'AE');

		INSERT INTO tours (id, title, description, country_id, price, currency, start_date, end_date, duration_days, category, image_url) VALUES
			(1, 'Стамбул тур', 'десц', 1, 700000, 'KZT', '2026-09-05', '2026-09-14', 9, 'city', 'https://example.com/1.jpg'),
			(2, 'Стамбул дорогой тур', 'десц', 1, 900000, 'KZT', '2026-10-01', '2026-10-08', 7, 'city', 'https://example.com/2.jpg'),
			(3, 'ОАЭ пляжный тур', 'десц', 2, 800000, 'KZT', '2026-09-10', '2026-09-17', 7, 'beach', 'https://example.com/3.jpg');
	`)
	if err != nil {
		t.Fatalf("seed fixture: %v", err)
	}
}

func newTestApp(t *testing.T) (http.Handler, *pgxpool.Pool) {
	t.Helper()
	pool := testutil.RequireDB(t)
	testutil.TruncateAll(t, pool)
	seedFixture(t, pool)
	return app.New(repository.New(pool)), pool
}

func doRequest(t *testing.T, h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestHealth(t *testing.T) {
	pool := testutil.RequireDB(t)
	testutil.TruncateAll(t, pool)
	h := app.New(repository.New(pool))

	rec := doRequest(t, h, http.MethodGet, "/health", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

func TestListCountries(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/countries", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var countries []dto.Country
	if err := json.Unmarshal(rec.Body.Bytes(), &countries); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if len(countries) != 2 {
		t.Fatalf("expected 2 countries, got %d", len(countries))
	}
}

func TestListTours_NoFilters(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	var resp dto.TourListResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Total != 3 || len(resp.Items) != 3 {
		t.Fatalf("expected 3 tours, got total=%d items=%d", resp.Total, len(resp.Items))
	}
}

func TestListTours_FilterByCountry(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours?country_id=2", "")
	var resp dto.TourListResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Total != 1 || resp.Items[0].ID != 3 {
		t.Fatalf("expected only tour 3 for country_id=2, got %+v", resp.Items)
	}
}

func TestListTours_FilterByPriceRange(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours?min_price=750000&max_price=850000", "")
	var resp dto.TourListResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Total != 1 || resp.Items[0].ID != 3 {
		t.Fatalf("expected only tour 3 in [750000,850000], got %+v", resp.Items)
	}
}

func TestListTours_FilterByDateRange(t *testing.T) {
	h, _ := newTestApp(t)

	// Overlaps tours 1 (2026-09-05..14) and 3 (2026-09-10..17), not 2 (Oct).
	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours?date_from=2026-09-01&date_to=2026-09-30", "")
	var resp dto.TourListResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Total != 2 {
		t.Fatalf("expected 2 tours overlapping September, got %d: %+v", resp.Total, resp.Items)
	}
}

func TestListTours_Pagination(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours?limit=2&page=1", "")
	var resp dto.TourListResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if resp.Total != 3 || len(resp.Items) != 2 || resp.Page != 1 || resp.Limit != 2 {
		t.Fatalf("unexpected pagination result: %+v", resp)
	}
}

func TestListTours_InvalidQueryParam(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours?min_price=not-a-number", "")
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestGetTour_Found(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours/1", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var tour dto.Tour
	if err := json.Unmarshal(rec.Body.Bytes(), &tour); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if tour.ID != 1 {
		t.Fatalf("expected tour id 1, got %d", tour.ID)
	}
}

func TestGetTour_NotFound(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/tours/9999", "")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestCreateBooking_Success(t *testing.T) {
	h, _ := newTestApp(t)

	body := `{"tour_id":1,"customer_name":"Ivan","customer_email":"ivan@example.com","customer_phone":"+77001234567","num_people":2}`
	rec := doRequest(t, h, http.MethodPost, "/api/v1/bookings", body)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var booking dto.Booking
	if err := json.Unmarshal(rec.Body.Bytes(), &booking); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if booking.Status != "pending" || booking.TourID != 1 {
		t.Fatalf("unexpected booking: %+v", booking)
	}

	getRec := doRequest(t, h, http.MethodGet, "/api/v1/bookings/"+strconv.Itoa(int(booking.ID)), "")
	if getRec.Code != http.StatusOK {
		t.Fatalf("expected 200 fetching created booking, got %d", getRec.Code)
	}
}

func TestCreateBooking_TourNotFound(t *testing.T) {
	h, _ := newTestApp(t)

	body := `{"tour_id":9999,"customer_name":"Ivan","customer_email":"ivan@example.com","customer_phone":"+77001234567","num_people":2}`
	rec := doRequest(t, h, http.MethodPost, "/api/v1/bookings", body)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestCreateBooking_InvalidEmail(t *testing.T) {
	h, _ := newTestApp(t)

	body := `{"tour_id":1,"customer_name":"Ivan","customer_email":"not-an-email","customer_phone":"+77001234567","num_people":2}`
	rec := doRequest(t, h, http.MethodPost, "/api/v1/bookings", body)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestCreateBooking_NumPeopleZero(t *testing.T) {
	h, _ := newTestApp(t)

	body := `{"tour_id":1,"customer_name":"Ivan","customer_email":"ivan@example.com","customer_phone":"+77001234567","num_people":0}`
	rec := doRequest(t, h, http.MethodPost, "/api/v1/bookings", body)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestGetBooking_NotFound(t *testing.T) {
	h, _ := newTestApp(t)

	rec := doRequest(t, h, http.MethodGet, "/api/v1/bookings/9999", "")
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
	}
}
