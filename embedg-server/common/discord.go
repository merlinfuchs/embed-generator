package common

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/disgoorg/disgo/rest"
)

func IsDiscordRestErrorCode(err error, codes ...rest.JSONErrorCode) bool {
	var httpErr *rest.Error
	if errors.As(err, &httpErr) {
		for _, code := range codes {
			if httpErr.Code == code {
				return true
			}
		}
	}

	return false
}

func IsDiscordRestStatusCode(err error, statusCodes ...int) bool {
	var httpErr *rest.Error
	if errors.As(err, &httpErr) {
		if httpErr.Response == nil {
			return false
		}

		for _, statusCode := range statusCodes {
			if httpErr.Response.StatusCode == statusCode {
				return true
			}
		}
	}

	return false
}

// DiscordRejectionMessage returns Discord's error when it rejected a request with a 4xx, which
// means the request itself was wrong (message too large, unknown channel, missing permissions)
// and the error is worth showing to the user.
func DiscordRejectionMessage(err error) (msg string, ok bool) {
	var restErr *rest.Error
	if !errors.As(err, &restErr) || restErr.Response == nil ||
		restErr.Response.StatusCode < 400 || restErr.Response.StatusCode >= 500 {
		return "", false
	}

	// rest.Error renders Discord's error tree and has panicked on shapes it didn't expect.
	defer func() {
		if r := recover(); r != nil {
			msg, ok = "Discord rejected the request.", true
		}
	}()
	return restErr.Error(), true
}

func DiscordAvatarURL(id ID, discriminator string, avatar string) string {
	if avatar == "" {
		parsedDiscriminator, _ := strconv.Atoi(discriminator)
		return fmt.Sprintf("https://cdn.discordapp.com/embed/avatars/%d.png", parsedDiscriminator%5)
	}

	return fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", id, avatar)
}
