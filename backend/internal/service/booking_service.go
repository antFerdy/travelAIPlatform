package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"travelaiplatform/backend/internal/apperror"
	"travelaiplatform/backend/internal/dto"
	"travelaiplatform/backend/internal/repository"
)

type BookingService struct {
	q repository.Querier
}

func NewBookingService(q repository.Querier) *BookingService {
	return &BookingService{q: q}
}

func (s *BookingService) CreateBooking(ctx context.Context, req dto.CreateBookingRequest) (dto.Booking, error) {
	exists, err := s.q.TourExists(ctx, req.TourID)
	if err != nil {
		return dto.Booking{}, fmt.Errorf("check tour exists: %w", err)
	}
	if !exists {
		return dto.Booking{}, apperror.NotFound("tour %d not found", req.TourID)
	}

	b, err := s.q.CreateBooking(ctx, repository.CreateBookingParams{
		TourID:        req.TourID,
		CustomerName:  req.CustomerName,
		CustomerEmail: req.CustomerEmail,
		CustomerPhone: req.CustomerPhone,
		NumPeople:     req.NumPeople,
	})
	if err != nil {
		return dto.Booking{}, fmt.Errorf("create booking: %w", err)
	}

	return bookingToDTO(b), nil
}

func (s *BookingService) GetBooking(ctx context.Context, id int32) (dto.Booking, error) {
	b, err := s.q.GetBooking(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return dto.Booking{}, apperror.NotFound("booking %d not found", id)
		}
		return dto.Booking{}, fmt.Errorf("get booking: %w", err)
	}
	return bookingToDTO(b), nil
}
