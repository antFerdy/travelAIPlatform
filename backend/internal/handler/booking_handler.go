package handler

import (
	"context"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"

	"travelaiplatform/backend/internal/apperror"
	"travelaiplatform/backend/internal/dto"
)

type BookingService interface {
	CreateBooking(ctx context.Context, req dto.CreateBookingRequest) (dto.Booking, error)
	GetBooking(ctx context.Context, id int32) (dto.Booking, error)
}

type BookingHandler struct {
	svc      BookingService
	validate *validator.Validate
}

func NewBookingHandler(svc BookingService) *BookingHandler {
	return &BookingHandler{svc: svc, validate: validator.New()}
}

func (h *BookingHandler) Create(c echo.Context) error {
	var req dto.CreateBookingRequest
	if err := c.Bind(&req); err != nil {
		return apperror.Validation("invalid request body")
	}
	if err := h.validate.Struct(req); err != nil {
		return apperror.Validation("validation failed: %v", err)
	}

	booking, err := h.svc.CreateBooking(c.Request().Context(), req)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, booking)
}

func (h *BookingHandler) Get(c echo.Context) error {
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}

	booking, err := h.svc.GetBooking(c.Request().Context(), id)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, booking)
}
