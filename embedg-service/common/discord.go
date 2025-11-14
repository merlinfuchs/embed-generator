package common

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/disgoorg/disgo/rest"
)

func IsDiscordRestErrorCode(err error, codes ...int) bool {
	var httpErr *rest.Error
	if errors.As(err, &httpErr) {
		for _, code := range codes {
			if int(httpErr.Code) == code {
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

func DiscordAvatarURL(id ID, discriminator string, avatar string) string {
	if avatar == "" {
		parsedDiscriminator, _ := strconv.Atoi(discriminator)
		return fmt.Sprintf("https://cdn.discordapp.com/embed/avatars/%d.png", parsedDiscriminator%5)
	}

	return fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", id, avatar)
}
