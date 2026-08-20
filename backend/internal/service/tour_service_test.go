package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"travelaiplatform/backend/internal/apperror"
	"travelaiplatform/backend/internal/dto"
	"travelaiplatform/backend/internal/repository"
)

func mustNumeric(t *testing.T, f float64) pgtype.Numeric {
	t.Helper()
	n, err := numericFromFloat64(f)
	if err != nil {
		t.Fatalf("numericFromFloat64(%v): %v", f, err)
	}
	return n
}

func mustDate(t *testing.T, s string) pgtype.Date {
	t.Helper()
	d, err := dateFromString(s)
	if err != nil {
		t.Fatalf("dateFromString(%v): %v", s, err)
	}
	return d
}

func sampleTour(t *testing.T, id int32) repository.Tour {
	t.Helper()
	return repository.Tour{
		ID:           id,
		Title:        "Стамбул: Kaya Madrid Hotel, 9 ночей",
		Description:  "Городской тур",
		CountryID:    2,
		Price:        mustNumeric(t, 735000),
		Currency:     "KZT",
		StartDate:    mustDate(t, "2026-09-05"),
		EndDate:      mustDate(t, "2026-09-14"),
		DurationDays: 9,
		Category:     pgtype.Text{String: "city", Valid: true},
		ImageUrl:     pgtype.Text{String: "https://example.com/img.jpg", Valid: true},
		CreatedAt:    pgtype.Timestamptz{Time: time.Date(2026, 8, 20, 0, 0, 0, 0, time.UTC), Valid: true},
	}
}

func TestTourService_ListTours_AppliesFilters(t *testing.T) {
	countryID := int32(2)
	minPrice := 600000.0
	maxPrice := 800000.0
	dateFrom := "2026-09-01"
	dateTo := "2026-09-30"

	var gotListParams repository.ListToursParams
	var gotCountParams repository.CountToursParams

	q := &mockQuerier{
		listToursFn: func(ctx context.Context, arg repository.ListToursParams) ([]repository.Tour, error) {
			gotListParams = arg
			return []repository.Tour{sampleTour(t, 1)}, nil
		},
		countToursFn: func(ctx context.Context, arg repository.CountToursParams) (int64, error) {
			gotCountParams = arg
			return 1, nil
		},
	}

	svc := NewTourService(q)
	result, err := svc.ListTours(context.Background(), dto.TourFilter{
		CountryID: &countryID,
		MinPrice:  &minPrice,
		MaxPrice:  &maxPrice,
		DateFrom:  &dateFrom,
		DateTo:    &dateTo,
		Page:      2,
		Limit:     10,
	})
	if err != nil {
		t.Fatalf("ListTours: %v", err)
	}

	if gotListParams.CountryID.Int32 != 2 || !gotListParams.CountryID.Valid {
		t.Errorf("expected country_id filter 2, got %+v", gotListParams.CountryID)
	}
	if gotListParams.Offset != 10 {
		t.Errorf("expected offset 10 (page 2, limit 10), got %d", gotListParams.Offset)
	}
	if gotListParams.Limit != 10 {
		t.Errorf("expected limit 10, got %d", gotListParams.Limit)
	}
	if !gotCountParams.MinPrice.Valid || !gotCountParams.MaxPrice.Valid {
		t.Errorf("expected count params to carry price filters, got %+v", gotCountParams)
	}

	if len(result.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(result.Items))
	}
	if result.Items[0].Price != 735000 {
		t.Errorf("expected price 735000, got %v", result.Items[0].Price)
	}
	if result.Total != 1 {
		t.Errorf("expected total 1, got %d", result.Total)
	}
	if result.Page != 2 || result.Limit != 10 {
		t.Errorf("expected page=2 limit=10 echoed back, got page=%d limit=%d", result.Page, result.Limit)
	}
}

func TestTourService_ListTours_InvalidDateFrom(t *testing.T) {
	q := &mockQuerier{}
	svc := NewTourService(q)

	badDate := "not-a-date"
	_, err := svc.ListTours(context.Background(), dto.TourFilter{
		DateFrom: &badDate,
		Page:     1,
		Limit:    20,
	})

	var appErr *apperror.Error
	if !errors.As(err, &appErr) || appErr.Status != 422 {
		t.Fatalf("expected 422 validation error, got %v", err)
	}
}

func TestTourService_GetTour_Found(t *testing.T) {
	q := &mockQuerier{
		getTourFn: func(ctx context.Context, id int32) (repository.Tour, error) {
			return sampleTour(t, id), nil
		},
	}
	svc := NewTourService(q)

	tour, err := svc.GetTour(context.Background(), 5)
	if err != nil {
		t.Fatalf("GetTour: %v", err)
	}
	if tour.ID != 5 {
		t.Errorf("expected id 5, got %d", tour.ID)
	}
	if tour.StartDate != "2026-09-05" || tour.EndDate != "2026-09-14" {
		t.Errorf("unexpected dates: %s - %s", tour.StartDate, tour.EndDate)
	}
}

func TestTourService_GetTour_NotFound(t *testing.T) {
	q := &mockQuerier{
		getTourFn: func(ctx context.Context, id int32) (repository.Tour, error) {
			return repository.Tour{}, pgx.ErrNoRows
		},
	}
	svc := NewTourService(q)

	_, err := svc.GetTour(context.Background(), 9999)

	var appErr *apperror.Error
	if !errors.As(err, &appErr) || appErr.Status != 404 {
		t.Fatalf("expected 404 not-found error, got %v", err)
	}
}
