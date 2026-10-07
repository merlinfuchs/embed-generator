package logging

import (
	"bytes"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"testing"
)

func TestRedact(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{
			"discord webhook",
			`Post "https://discord.com/api/v10/webhooks/1197103400257589359/hCwS2og-xf1_ep?wait=true": dial tcp: i/o timeout`,
			`Post "https://discord.com/api/v10/webhooks/1197103400257589359/[redacted]?wait=true": dial tcp: i/o timeout`,
		},
		{
			"webhook message edit keeps the message id",
			"PATCH https://discord.com/api/v10/webhooks/123/token/messages/456 failed",
			"PATCH https://discord.com/api/v10/webhooks/123/[redacted]/messages/456 failed",
		},
		{
			"fluxer webhook",
			`Post "https://api.fluxer.app/webhooks/abc123/tok3n": EOF`,
			`Post "https://api.fluxer.app/webhooks/abc123/[redacted]": EOF`,
		},
		{"webhook id alone is kept", "unknown webhook /webhooks/123", "unknown webhook /webhooks/123"},
		{"other text is untouched", "failed to get guild 123", "failed to get guild 123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := redact(tt.in); got != tt.want {
				t.Errorf("redact(%q)\n got %q\nwant %q", tt.in, got, tt.want)
			}
		})
	}
}

type panickingError struct{}

func (panickingError) Error() string { panic("bad error tree") }

func TestRedactHandler(t *testing.T) {
	const token = "s3cretT0ken"

	// A real network error, which is where the URL ends up in the text.
	_, netErr := http.Post("http://127.0.0.1:1/api/v10/webhooks/123/"+token+"?wait=true", "application/json", nil)
	if netErr == nil || !strings.Contains(netErr.Error(), token) {
		t.Fatalf("expected a network error containing the token, got %v", netErr)
	}

	var buf bytes.Buffer
	logger := slog.New(redactHandler{slog.NewJSONHandler(&buf, nil)})
	logger.With(slog.String("url", "/webhooks/123/"+token)).
		WithGroup("request").
		Error(
			"failed to send to /webhooks/123/"+token,
			slog.Any("error", fmt.Errorf("failed to send message: %w", netErr)),
			slog.Group("webhook", slog.String("url", "/webhooks/123/"+token)),
			slog.Any("panicking", panickingError{}),
		)

	out := buf.String()
	if strings.Contains(out, token) {
		t.Errorf("token in log output: %s", out)
	}
	if strings.Count(out, "[redacted]") != 4 {
		t.Errorf("expected 4 redactions: %s", out)
	}
	if !strings.Contains(out, "bad error tree") {
		t.Errorf("panicking error should still be logged: %s", out)
	}
}
