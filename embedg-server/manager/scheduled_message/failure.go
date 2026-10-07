package scheduled_messages

import (
	"errors"
	"net/http"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// Long enough for Discord's error on a message with many invalid fields.
const maxReasonLength = 1000

type failureOutcome int

const (
	// outcomeRetry keeps the run due, the failure may be a hiccup.
	outcomeRetry failureOutcome = iota
	// outcomeSkip records the failure and moves on to the next run, retrying would fail the same way.
	outcomeSkip
	// outcomeStop disables the scheduled message, no run can succeed anymore.
	outcomeStop
)

// runError fixes what a failed send means for the scheduled message and what the user is shown.
type runError struct {
	outcome failureOutcome
	reason  string
	err     error
}

func (e *runError) Error() string {
	if e.err != nil {
		return e.err.Error()
	}
	return e.reason
}

func (e *runError) Unwrap() error {
	return e.err
}

func stopWith(reason string) error {
	return &runError{outcome: outcomeStop, reason: reason}
}

// skipWith records the reason and moves on to the next run, the message itself is the problem
// and fails the same way on every retry.
func skipWith(reason string, err error) error {
	return &runError{outcome: outcomeSkip, reason: reason, err: err}
}

// classifyFailure decides what a failed send means for the scheduled message and what the user is
// shown about it.
func classifyFailure(err error) (failureOutcome, string) {
	var runErr *runError
	if errors.As(err, &runErr) {
		return runErr.outcome, truncateReason(runErr.reason)
	}

	// Discord rejecting the message itself, an invalid form body most of the time.
	if common.IsDiscordRestStatusCode(err, http.StatusBadRequest) {
		msg, _ := common.DiscordRejectionMessage(err)
		return outcomeSkip, truncateReason("Discord rejected the message: " + msg)
	}

	return outcomeRetry, "The message couldn't be sent because of a temporary error, this run was skipped."
}

func truncateReason(reason string) string {
	runes := []rune(reason)
	if len(runes) <= maxReasonLength {
		return reason
	}
	return string(runes[:maxReasonLength-1]) + "…"
}
