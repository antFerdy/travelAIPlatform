package service

import (
	"context"
	"fmt"

	"travelaiplatform/backend/internal/dto"
	"travelaiplatform/backend/internal/repository"
)

type CountryService struct {
	q repository.Querier
}

func NewCountryService(q repository.Querier) *CountryService {
	return &CountryService{q: q}
}

func (s *CountryService) ListCountries(ctx context.Context) ([]dto.Country, error) {
	rows, err := s.q.ListCountries(ctx)
	if err != nil {
		return nil, fmt.Errorf("list countries: %w", err)
	}

	items := make([]dto.Country, 0, len(rows))
	for _, r := range rows {
		items = append(items, countryToDTO(r))
	}
	return items, nil
}
