package util

import (
	"fmt"

	"github.com/spf13/viper"
)

func Ptr[T any](val T) *T {
	return &val
}

func BotInviteURL() string {
	return fmt.Sprintf("https://discord.com/oauth2/authorize?client_id=%s&scope=bot%%20applications.commands&permissions=536871936", viper.GetString("discord.client_id"))
}
