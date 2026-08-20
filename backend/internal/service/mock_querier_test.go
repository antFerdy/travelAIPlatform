package service

import (
	"context"

	"travelaiplatform/backend/internal/repository"
)

type mockQuerier struct {
	countToursFn    func(ctx context.Context, arg repository.CountToursParams) (int64, error)
	createBookingFn func(ctx context.Context, arg repository.CreateBookingParams) (repository.Booking, error)
	getBookingFn    func(ctx context.Context, id int32) (repository.Booking, error)
	getTourFn       func(ctx context.Context, id int32) (repository.Tour, error)
	listCountriesFn func(ctx context.Context) ([]repository.Country, error)
	listToursFn     func(ctx context.Context, arg repository.ListToursParams) ([]repository.Tour, error)
	tourExistsFn    func(ctx context.Context, id int32) (bool, error)
}

func (m *mockQuerier) CountTours(ctx context.Context, arg repository.CountToursParams) (int64, error) {
	return m.countToursFn(ctx, arg)
}

func (m *mockQuerier) CreateBooking(ctx context.Context, arg repository.CreateBookingParams) (repository.Booking, error) {
	return m.createBookingFn(ctx, arg)
}

func (m *mockQuerier) GetBooking(ctx context.Context, id int32) (repository.Booking, error) {
	return m.getBookingFn(ctx, id)
}

func (m *mockQuerier) GetTour(ctx context.Context, id int32) (repository.Tour, error) {
	return m.getTourFn(ctx, id)
}

func (m *mockQuerier) ListCountries(ctx context.Context) ([]repository.Country, error) {
	return m.listCountriesFn(ctx)
}

func (m *mockQuerier) ListTours(ctx context.Context, arg repository.ListToursParams) ([]repository.Tour, error) {
	return m.listToursFn(ctx, arg)
}

func (m *mockQuerier) TourExists(ctx context.Context, id int32) (bool, error) {
	return m.tourExistsFn(ctx, id)
}

var _ repository.Querier = (*mockQuerier)(nil)
