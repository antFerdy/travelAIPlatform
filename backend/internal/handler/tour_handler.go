package handler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"travelaiplatform/backend/internal/apperror"
	"travelaiplatform/backend/internal/dto"
)

type TourService interface {
	ListTours(ctx context.Context, f dto.TourFilter) (dto.TourListResponse, error)
	GetTour(ctx context.Context, id int32) (dto.Tour, error)
}

type TourHandler struct {
	svc TourService
}

func NewTourHandler(svc TourService) *TourHandler {
	return &TourHandler{svc: svc}
}

func (h *TourHandler) List(c echo.Context) error {
	f := dto.TourFilter{Page: 1, Limit: 20}

	if v := c.QueryParam("country_id"); v != "" {
		id, err := strconv.ParseInt(v, 10, 32)
		if err != nil {
			return apperror.Validation("invalid country_id")
		}
		id32 := int32(id)
		f.CountryID = &id32
	}
	if v := c.QueryParam("min_price"); v != "" {
		p, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return apperror.Validation("invalid min_price")
		}
		f.MinPrice = &p
	}
	if v := c.QueryParam("max_price"); v != "" {
		p, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return apperror.Validation("invalid max_price")
		}
		f.MaxPrice = &p
	}
	if v := c.QueryParam("date_from"); v != "" {
		f.DateFrom = &v
	}
	if v := c.QueryParam("date_to"); v != "" {
		f.DateTo = &v
	}
	if v := c.QueryParam("page"); v != "" {
		p, err := strconv.Atoi(v)
		if err != nil || p < 1 {
			return apperror.Validation("invalid page")
		}
		f.Page = p
	}
	if v := c.QueryParam("limit"); v != "" {
		l, err := strconv.Atoi(v)
		if err != nil || l < 1 {
			return apperror.Validation("invalid limit")
		}
		if l > 100 {
			l = 100
		}
		f.Limit = l
	}

	result, err := h.svc.ListTours(c.Request().Context(), f)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, result)
}

func (h *TourHandler) Get(c echo.Context) error {
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}

	tour, err := h.svc.GetTour(c.Request().Context(), id)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, tour)
}
