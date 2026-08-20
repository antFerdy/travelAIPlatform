package service

import (
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"travelaiplatform/backend/internal/dto"
	"travelaiplatform/backend/internal/repository"
)

const dateLayout = "2006-01-02"

func numericFromFloat64(f float64) (pgtype.Numeric, error) {
	var n pgtype.Numeric
	if err := n.Scan(fmt.Sprintf("%.2f", f)); err != nil {
		return pgtype.Numeric{}, err
	}
	return n, nil
}

func numericToFloat64(n pgtype.Numeric) float64 {
	f, err := n.Float64Value()
	if err != nil || !f.Valid {
		return 0
	}
	return f.Float64
}

func dateFromString(s string) (pgtype.Date, error) {
	t, err := time.Parse(dateLayout, s)
	if err != nil {
		return pgtype.Date{}, err
	}
	return pgtype.Date{Time: t, Valid: true}, nil
}

func dateToString(d pgtype.Date) string {
	if !d.Valid {
		return ""
	}
	return d.Time.Format(dateLayout)
}

func textToString(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String
}

func tourToDTO(t repository.Tour) dto.Tour {
	return dto.Tour{
		ID:           t.ID,
		Title:        t.Title,
		Description:  t.Description,
		CountryID:    t.CountryID,
		Price:        numericToFloat64(t.Price),
		Currency:     t.Currency,
		StartDate:    dateToString(t.StartDate),
		EndDate:      dateToString(t.EndDate),
		DurationDays: t.DurationDays,
		Category:     textToString(t.Category),
		ImageURL:     textToString(t.ImageUrl),
		CreatedAt:    t.CreatedAt.Time.Format(time.RFC3339),
	}
}

func countryToDTO(c repository.Country) dto.Country {
	return dto.Country{ID: c.ID, Name: c.Name, Code: c.Code}
}

func bookingToDTO(b repository.Booking) dto.Booking {
	return dto.Booking{
		ID:            b.ID,
		TourID:        b.TourID,
		CustomerName:  b.CustomerName,
		CustomerEmail: b.CustomerEmail,
		CustomerPhone: b.CustomerPhone,
		NumPeople:     b.NumPeople,
		Status:        b.Status,
		CreatedAt:     b.CreatedAt.Time.Format(time.RFC3339),
	}
}
