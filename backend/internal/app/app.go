// Package app wires repositories, services and handlers into a runnable
// Echo instance. Kept separate from cmd/api/main.go so integration tests
// can build the same router against a test database without duplicating
// the wiring.
package app

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"travelaiplatform/backend/internal/apperror"
	"travelaiplatform/backend/internal/handler"
	"travelaiplatform/backend/internal/repository"
	"travelaiplatform/backend/internal/service"
)

func New(q repository.Querier) *echo.Echo {
	tourSvc := service.NewTourService(q)
	countrySvc := service.NewCountryService(q)
	bookingSvc := service.NewBookingService(q)

	tourHandler := handler.NewTourHandler(tourSvc)
	countryHandler := handler.NewCountryHandler(countrySvc)
	bookingHandler := handler.NewBookingHandler(bookingSvc)

	e := echo.New()
	e.HideBanner = true
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.Use(middleware.RequestID())
	e.Use(jsonCharsetMiddleware)
	e.HTTPErrorHandler = errorHandler

	e.GET("/health", handler.Health)

	v1 := e.Group("/api/v1")
	v1.GET("/countries", countryHandler.List)
	v1.GET("/tours", tourHandler.List)
	v1.GET("/tours/:id", tourHandler.Get)
	v1.POST("/bookings", bookingHandler.Create)
	v1.GET("/bookings/:id", bookingHandler.Get)

	return e
}

// jsonCharsetMiddleware sets an explicit charset on the JSON content type.
// Echo's c.JSON only sets Content-Type when it isn't already set, so this
// runs before handlers. Without it, "application/json" (no charset) is
// technically valid (JSON is UTF-8 by definition per RFC 8259), but Safari
// does not assume UTF-8 for it when a JSON response is opened directly and
// may render Cyrillic/other non-ASCII text as mojibake.
func jsonCharsetMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		c.Response().Header().Set(echo.HeaderContentType, echo.MIMEApplicationJSONCharsetUTF8)
		return next(c)
	}
}

func errorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}

	var appErr *apperror.Error
	if errors.As(err, &appErr) {
		_ = c.JSON(appErr.Status, map[string]string{"error": appErr.Message})
		return
	}

	var he *echo.HTTPError
	if errors.As(err, &he) {
		_ = c.JSON(he.Code, map[string]string{"error": fmt.Sprintf("%v", he.Message)})
		return
	}

	c.Logger().Error(err)
	_ = c.JSON(http.StatusInternalServerError, map[string]string{"error": "internal server error"})
}
