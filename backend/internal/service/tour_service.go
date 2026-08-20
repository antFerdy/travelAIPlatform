package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"travelaiplatform/backend/internal/apperror"
	"travelaiplatform/backend/internal/dto"
	"travelaiplatform/backend/internal/repository"
)

type TourService struct {
	q repository.Querier
}

func NewTourService(q repository.Querier) *TourService {
	return &TourService{q: q}
}

func (s *TourService) ListTours(ctx context.Context, f dto.TourFilter) (dto.TourListResponse, error) {
	listParams := repository.ListToursParams{
		Offset: int32((f.Page - 1) * f.Limit),
		Limit:  int32(f.Limit),
	}
	countParams := repository.CountToursParams{}

	if f.CountryID != nil {
		v := pgtype.Int4{Int32: *f.CountryID, Valid: true}
		listParams.CountryID = v
		countParams.CountryID = v
	}
	if f.MinPrice != nil {
		n, err := numericFromFloat64(*f.MinPrice)
		if err != nil {
			return dto.TourListResponse{}, apperror.Validation("invalid min_price")
		}
		listParams.MinPrice = n
		countParams.MinPrice = n
	}
	if f.MaxPrice != nil {
		n, err := numericFromFloat64(*f.MaxPrice)
		if err != nil {
			return dto.TourListResponse{}, apperror.Validation("invalid max_price")
		}
		listParams.MaxPrice = n
		countParams.MaxPrice = n
	}
	if f.DateFrom != nil {
		d, err := dateFromString(*f.DateFrom)
		if err != nil {
			return dto.TourListResponse{}, apperror.Validation("invalid date_from, expected YYYY-MM-DD")
		}
		listParams.DateFrom = d
		countParams.DateFrom = d
	}
	if f.DateTo != nil {
		d, err := dateFromString(*f.DateTo)
		if err != nil {
			return dto.TourListResponse{}, apperror.Validation("invalid date_to, expected YYYY-MM-DD")
		}
		listParams.DateTo = d
		countParams.DateTo = d
	}

	rows, err := s.q.ListTours(ctx, listParams)
	if err != nil {
		return dto.TourListResponse{}, fmt.Errorf("list tours: %w", err)
	}

	total, err := s.q.CountTours(ctx, countParams)
	if err != nil {
		return dto.TourListResponse{}, fmt.Errorf("count tours: %w", err)
	}

	items := make([]dto.Tour, 0, len(rows))
	for _, r := range rows {
		items = append(items, tourToDTO(r))
	}

	return dto.TourListResponse{
		Items: items,
		Page:  f.Page,
		Limit: f.Limit,
		Total: total,
	}, nil
}

func (s *TourService) GetTour(ctx context.Context, id int32) (dto.Tour, error) {
	t, err := s.q.GetTour(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return dto.Tour{}, apperror.NotFound("tour %d not found", id)
		}
		return dto.Tour{}, fmt.Errorf("get tour: %w", err)
	}
	return tourToDTO(t), nil
}
