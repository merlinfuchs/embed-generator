package scheduled_messages

import (
	"errors"
	"fmt"
	"net/http"
	"testing"

	"github.com/disgoorg/disgo/rest"
)

func TestSendRejected(t *testing.T) {
	discordErr := func(status int) error {
		return fmt.Errorf("failed to send: %w", &rest.Error{Response: &http.Response{StatusCode: status}})
	}

	for _, tt := range []struct {
		name string
		err  error
		want bool
	}{
		{"invalid form body", discordErr(http.StatusBadRequest), true},
		{"saved message doesn't decode", fmt.Errorf("%w: bad timestamp", errInvalidMessage), true},
		{"rate limited", discordErr(http.StatusTooManyRequests), false},
		{"discord outage", discordErr(http.StatusServiceUnavailable), false},
		{"database", errors.New("connection refused"), false},
	} {
		if got := sendRejected(tt.err); got != tt.want {
			t.Errorf("%s: sendRejected = %v, want %v", tt.name, got, tt.want)
		}
	}
}
