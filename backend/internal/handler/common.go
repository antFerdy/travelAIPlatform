package handler

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"travelaiplatform/backend/internal/apperror"
)

func parseIDParam(c echo.Context) (int32, error) {
	v := c.Param("id")
	id, err := strconv.ParseInt(v, 10, 32)
	if err != nil {
		return 0, apperror.Validation("invalid id: %s", v)
	}
	return int32(id), nil
}

func Health(c echo.Context) error {
	return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
}
