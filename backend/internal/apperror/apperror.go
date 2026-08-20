package apperror

import "fmt"

// Error is a typed application error that carries the HTTP status it should
// be reported as. Handlers and the central Echo error handler translate it
// into a uniform {"error": "..."} JSON response.
type Error struct {
	Status  int
	Message string
}

func (e *Error) Error() string {
	return e.Message
}

func NotFound(format string, args ...any) *Error {
	return &Error{Status: 404, Message: fmt.Sprintf(format, args...)}
}

func Validation(format string, args ...any) *Error {
	return &Error{Status: 422, Message: fmt.Sprintf(format, args...)}
}
