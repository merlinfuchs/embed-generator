package send_message

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
)

// Fluxer's webhook routes, request bodies and message objects match Discord's, so disgo's client
// works against its API. https://docs.fluxer.app/http-api/webhooks/
const (
	fluxerAPIURL   = "https://api.fluxer.app/v1"
	fluxerMediaURL = "https://fluxerusercontent.com"
)

func newFluxerRest(url string) rest.Rest {
	return rest.New(rest.NewClient("", rest.WithURL(url), rest.WithRateLimiter(fluxerRateLimiter{})))
}

// fluxerRateLimiter leaves rate limits to Fluxer. disgo's limiter reads a 429 without Cloudflare's
// via header as a global limit, which on this client shared by all users would hold up every
// Fluxer send. A 429 goes back to the user instead, as Fluxer limits each webhook on its own.
type fluxerRateLimiter struct{}

func (fluxerRateLimiter) MaxRetries() int                                     { return 0 }
func (fluxerRateLimiter) Close(context.Context)                               {}
func (fluxerRateLimiter) Reset()                                              {}
func (fluxerRateLimiter) Wait(context.Context, *rest.CompiledEndpoint) error  { return nil }
func (fluxerRateLimiter) Unlock(*rest.CompiledEndpoint, *http.Response) error { return nil }

// webhookRest is the client for webhooks on the platform.
func (h *SendMessageHandler) webhookRest(platform wire.WebhookPlatform) rest.Rest {
	if platform == wire.WebhookPlatformFluxer {
		return h.fluxerRest
	}
	return h.rest
}

// fluxerError turns an error response from Fluxer into one for the user. Fluxer's error codes are
// strings, which disgo can't read into rest.Error.Code, so they are parsed from the body here.
func fluxerError(err error) error {
	var restErr *rest.Error
	if !errors.As(err, &restErr) || restErr.Response == nil {
		return err
	}

	var body struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	_ = json.Unmarshal(restErr.RsBody, &body)

	status := restErr.Response.StatusCode
	switch {
	case body.Code == "UNKNOWN_WEBHOOK":
		return handlers.NotFound("unknown_webhook", "The webhook does not exist.")
	case body.Code == "UNKNOWN_MESSAGE":
		return handlers.NotFound("unknown_message", "The message does not exist.")
	case status == http.StatusTooManyRequests:
		return handlers.BadRequest("rate_limited", "Fluxer is rate limiting this webhook, try again in a few seconds.")
	case status >= 400 && status < 500:
		message := body.Message
		if message == "" {
			message = http.StatusText(status)
		}
		return handlers.BadRequest("fluxer_error", fmt.Sprintf("Fluxer rejected the request: %s", message))
	}
	return err
}

// fluxerAvatarURL is the avatar the message was sent with, or empty for the webhook's default one.
func fluxerAvatarURL(user discord.User) string {
	if user.Avatar == nil {
		return ""
	}
	return fmt.Sprintf("%s/avatars/%s/%s.png", fluxerMediaURL, user.ID, *user.Avatar)
}
