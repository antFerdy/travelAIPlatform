package dto

type Country struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
	Code string `json:"code"`
}

type Tour struct {
	ID           int32   `json:"id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	CountryID    int32   `json:"country_id"`
	Price        float64 `json:"price"`
	Currency     string  `json:"currency"`
	StartDate    string  `json:"start_date"`
	EndDate      string  `json:"end_date"`
	DurationDays int32   `json:"duration_days"`
	Category     string  `json:"category,omitempty"`
	ImageURL     string  `json:"image_url,omitempty"`
	CreatedAt    string  `json:"created_at"`
}

// TourFilter is the internal representation of GET /tours query parameters.
// Pointers distinguish "not provided" from a zero value.
type TourFilter struct {
	CountryID *int32
	MinPrice  *float64
	MaxPrice  *float64
	DateFrom  *string // "2006-01-02"
	DateTo    *string // "2006-01-02"
	Page      int
	Limit     int
}

type TourListResponse struct {
	Items []Tour `json:"items"`
	Page  int    `json:"page"`
	Limit int    `json:"limit"`
	Total int64  `json:"total"`
}

type Booking struct {
	ID            int32  `json:"id"`
	TourID        int32  `json:"tour_id"`
	CustomerName  string `json:"customer_name"`
	CustomerEmail string `json:"customer_email"`
	CustomerPhone string `json:"customer_phone"`
	NumPeople     int32  `json:"num_people"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
}

type CreateBookingRequest struct {
	TourID        int32  `json:"tour_id" validate:"required"`
	CustomerName  string `json:"customer_name" validate:"required"`
	CustomerEmail string `json:"customer_email" validate:"required,email"`
	CustomerPhone string `json:"customer_phone" validate:"required"`
	NumPeople     int32  `json:"num_people" validate:"required,gt=0"`
}
