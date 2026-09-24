package common

// UserError is an error whose message is meant for the user. The API returns its message
// as-is, even when it's wrapped in other errors.
type UserError struct {
	Message string
}

func NewUserError(message string) *UserError {
	return &UserError{Message: message}
}

func (e *UserError) Error() string {
	return e.Message
}
