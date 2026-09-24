package command

import (
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/handler"
)

func (g *CommandHandler) handleFormatTextCommand(e *handler.CommandEvent) error {
	value := e.SlashCommandInteractionData().String("text")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for the provided text: ```%s```", value),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleFormatUserCommand(e *handler.CommandEvent) error {
	user := e.SlashCommandInteractionData().User("user")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for %s: ```<@%s>```", user.Mention(), user.ID),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleFormatChannelCommand(e *handler.CommandEvent) error {
	channel := e.SlashCommandInteractionData().Channel("channel")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for <#%s>: ```<#%s>```", channel.ID, channel.ID),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleFormatRoleCommand(e *handler.CommandEvent) error {
	role := e.SlashCommandInteractionData().Role("role")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for %s: ```<@&%s>```", role.Mention(), role.ID),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleFormatEmojiCommand(e *handler.CommandEvent) error {
	emoji := e.SlashCommandInteractionData().String("emoji")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for %s: ```%s```", emoji, emoji),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleFormatMentionContextCommand(e *handler.CommandEvent) error {
	data := e.UserCommandInteractionData()
	user := data.TargetUser()

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for %s: ```<@%s>```", user.Mention(), user.ID),
		Flags:   discord.MessageFlagEphemeral,
	})
}
