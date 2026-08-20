package handler

import (
	"context"
	"net/http"

	"github.com/labstack/echo/v4"

	"travelaiplatform/backend/internal/dto"
)

type CountryService interface {
	ListCountries(ctx context.Context) ([]dto.Country, error)
}

type CountryHandler struct {
	svc CountryService
}

func NewCountryHandler(svc CountryService) *CountryHandler {
	return &CountryHandler{svc: svc}
}

func (h *CountryHandler) List(c echo.Context) error {
	items, err := h.svc.ListCountries(c.Request().Context())
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, items)
}
