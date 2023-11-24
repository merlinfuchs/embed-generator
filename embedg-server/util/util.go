package util

import (
	"crypto/sha256"
	"fmt"
	"mime"

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
