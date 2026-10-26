package scheduled_messages

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"testing"

	"github.com/disgoorg/disgo/rest"
)

func discordError(status int, code rest.JSONErrorCode, message string, errs string) error {
	return &rest.Error{
		Response: &http.Response{StatusCode: status, Status: http.StatusText(status)},
		Code:     code,
		Message:  message,
		Errors:   json.RawMessage(errs),
	}
}

func TestClassifyFailure(t *testing.T) {
	invalidBody := discordError(
		http.StatusBadRequest, 50035, "Invalid Form Body",
		`{"embeds":{"0":{"title":{"_errors":[{"code":"BASE_TYPE_MAX_LENGTH","message":"Must be 256 or fewer in length."}]}}}}`,
	)

	cases := []struct {
		name     string
		err      error
		outcome  failureOutcome
		contains string
	}{
		{"stop", fmt.Errorf("send: %w", stopWith("The channel was deleted.")), outcomeStop, "The channel was deleted."},
		{"invalid message", fmt.Errorf("send: %w", skipWith("Template error: boom", errors.New("boom"))), outcomeSkip, "Template error: boom"},
		{"invalid form body", fmt.Errorf("failed to send: %w", invalidBody), outcomeSkip, "Must be 256 or fewer in length."},
		{"missing access", discordError(http.StatusForbidden, 50001, "Missing Access", ""), outcomeRetry, "temporary error"},
		{"proxy block", discordError(http.StatusForbidden, 0, "", ""), outcomeRetry, "temporary error"},
		{"rate limited", discordError(http.StatusTooManyRequests, 0, "", ""), outcomeRetry, "temporary error"},
		{"discord outage", discordError(http.StatusServiceUnavailable, 0, "", ""), outcomeRetry, "temporary error"},
		{"database", errors.New("connection refused"), outcomeRetry, "temporary error"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			outcome, reason := classifyFailure(c.err)
			if outcome != c.outcome {
				t.Errorf("outcome = %v, want %v", outcome, c.outcome)
			}
			if !strings.Contains(reason, c.contains) {
				t.Errorf("reason %q doesn't contain %q", reason, c.contains)
			}
		})
	}
}

func TestCrosspostFailure(t *testing.T) {
	cases := []struct {
		name     string
		err      error
		contains string
	}{
		{"published", nil, ""},
		{"already published", discordError(http.StatusBadRequest, 40033, "This message has already been crossposted.", ""), ""},
		{"missing permissions", fmt.Errorf("crosspost: %w", discordError(http.StatusForbidden, 50013, "Missing Permissions", "")), "Manage Messages"},
		{"not an announcement channel", discordError(http.StatusBadRequest, 50024, "Cannot execute action on this channel type", ""), "announcement channel"},
		{"timed out", context.DeadlineExceeded, "10 messages per hour"},
		{"rate limited", discordError(http.StatusTooManyRequests, 0, "", ""), "10 messages per hour"},
		{"discord outage", discordError(http.StatusServiceUnavailable, 0, "", ""), "temporary error"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			reason := crosspostFailure(c.err)
			if reason.Valid != (c.contains != "") || !strings.Contains(reason.String, c.contains) {
				t.Errorf("reason = %v, want one containing %q", reason, c.contains)
			}
		})
	}
}

func TestTruncateReason(t *testing.T) {
	long := strings.Repeat("é", maxReasonLength+10)
	got := []rune(truncateReason(long))
	if len(got) != maxReasonLength || got[len(got)-1] != '…' {
		t.Errorf("truncated to %d runes ending in %q", len(got), got[len(got)-1])
	}

	if truncateReason("short") != "short" {
		t.Error("short reason changed")
	}
}
