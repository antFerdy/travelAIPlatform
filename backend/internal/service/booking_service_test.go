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

func TestBookingService_CreateBooking_TourNotFound(t *testing.T) {
	q := &mockQuerier{
		tourExistsFn: func(ctx context.Context, id int32) (bool, error) {
			return false, nil
		},
	}
	svc := NewBookingService(q)

	_, err := svc.CreateBooking(context.Background(), dto.CreateBookingRequest{
		TourID:        999,
		CustomerName:  "Ivan",
		CustomerEmail: "ivan@example.com",
		CustomerPhone: "+77001234567",
		NumPeople:     2,
	})

	var appErr *apperror.Error
	if !errors.As(err, &appErr) || appErr.Status != 404 {
		t.Fatalf("expected 404 not-found error, got %v", err)
	}
}

func TestBookingService_CreateBooking_Success(t *testing.T) {
	var gotParams repository.CreateBookingParams

	q := &mockQuerier{
		tourExistsFn: func(ctx context.Context, id int32) (bool, error) {
			return true, nil
		},
		createBookingFn: func(ctx context.Context, arg repository.CreateBookingParams) (repository.Booking, error) {
			gotParams = arg
			return repository.Booking{
				ID:            1,
				TourID:        arg.TourID,
				CustomerName:  arg.CustomerName,
				CustomerEmail: arg.CustomerEmail,
				CustomerPhone: arg.CustomerPhone,
				NumPeople:     arg.NumPeople,
				Status:        "pending",
				CreatedAt:     pgtype.Timestamptz{Time: time.Date(2026, 8, 20, 0, 0, 0, 0, time.UTC), Valid: true},
			}, nil
		},
	}
	svc := NewBookingService(q)

	booking, err := svc.CreateBooking(context.Background(), dto.CreateBookingRequest{
		TourID:        1,
		CustomerName:  "Ivan",
		CustomerEmail: "ivan@example.com",
		CustomerPhone: "+77001234567",
		NumPeople:     2,
	})
	if err != nil {
		t.Fatalf("CreateBooking: %v", err)
	}

	if gotParams.TourID != 1 || gotParams.NumPeople != 2 {
		t.Errorf("unexpected params passed to repository: %+v", gotParams)
	}
	if booking.Status != "pending" {
		t.Errorf("expected status pending, got %s", booking.Status)
	}
	if booking.ID != 1 {
		t.Errorf("expected id 1, got %d", booking.ID)
	}
}

func TestBookingService_GetBooking_NotFound(t *testing.T) {
	q := &mockQuerier{
		getBookingFn: func(ctx context.Context, id int32) (repository.Booking, error) {
			return repository.Booking{}, pgx.ErrNoRows
		},
	}
	svc := NewBookingService(q)

	_, err := svc.GetBooking(context.Background(), 42)

	var appErr *apperror.Error
	if !errors.As(err, &appErr) || appErr.Status != 404 {
		t.Fatalf("expected 404 not-found error, got %v", err)
	}
}
