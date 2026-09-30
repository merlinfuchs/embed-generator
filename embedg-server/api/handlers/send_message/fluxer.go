package send_message

import (
	"encoding/json"
	"errors"
	"fmt"

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

func newFluxerRest() rest.Rest {
	return rest.New(rest.NewClient("", rest.WithURL(fluxerAPIURL)))
}

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

	switch {
	case body.Code == "UNKNOWN_WEBHOOK":
		return handlers.NotFound("unknown_webhook", "The webhook does not exist.")
	case body.Code == "UNKNOWN_MESSAGE":
		return handlers.NotFound("unknown_message", "The message does not exist.")
	case restErr.Response.StatusCode >= 400 && restErr.Response.StatusCode < 500:
		return handlers.BadRequest("fluxer_error", fmt.Sprintf("Fluxer rejected the request: %s", body.Message))
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
