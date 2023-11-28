package util

import (
	"crypto/sha256"
	"fmt"
	"mime"
	"strconv"

	"github.com/merlinfuchs/discordgo"
	"github.com/spf13/viper"
)

func Ptr[T any](val T) *T {
	return &val
}

func BotInviteURL() string {
	return fmt.Sprintf("https://discord.com/oauth2/authorize?client_id=%s&scope=bot%%20applications.commands&permissions=536871936", viper.GetString("discord.client_id"))
}

func HashBytes(b []byte) string {
	hasher := sha256.New()
	hasher.Write(b)
	return fmt.Sprintf("%x", hasher.Sum(nil))
}

func GetFileExtensionFromMimeType(mimeType string) string {
	res, err := mime.ExtensionsByType(mimeType)
	if err != nil || len(res) == 0 {
		return ""
	}

	return res[0]
}

func IsDiscordRestErrorCode(err error, codes ...int) bool {
	if err, ok := err.(*discordgo.RESTError); ok {
		if err.Message == nil {
			return false
		}

		for _, code := range codes {
			if err.Message.Code == code {
				return true
			}
		}
	}
	return false
}

func DiscordAvatarURL(id string, discriminator string, avatar string) string {
	if avatar == "" {
		parsedDiscriminator, _ := strconv.Atoi(discriminator)
		return fmt.Sprintf("https://cdn.discordapp.com/embed/avatars/%d.png", parsedDiscriminator%5)
	}

	return fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", id, avatar)
}
