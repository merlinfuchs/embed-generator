package bot

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

func (b *Bot) RegisterCommand() error {
	_, err := b.Session.ApplicationCommandBulkOverwrite(viper.GetString("discord.client_id"), "", []*discordgo.ApplicationCommand{
		{
			Name:        "help",
			Description: "Show help",
		},
		{
			Name:        "invite",
			Description: "Invite the Embed Generator bot to your server",
		},
		{
			Name:        "website",
			Description: "Open the Embed Generator website",
		},
		{
			Name:        "format",
			Description: "Get the API format for mentions, channels, roles, & custom emojis",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "text",
					Description: "Get the API format for a text with multiple mentions, channels, & custom emojis",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionString,
							Name:        "text",
							Description: "The text that you want to format (usually containing mentions or custom emojis)",
							Required:    true,
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "user",
					Description: "Get the API format for mentioning a user",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionUser,
							Name:        "user",
							Description: "The user you want to mention",
							Required:    true,
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "channel",
					Description: "Get the API format for mentioning a channel",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionChannel,
							Name:        "channel",
							Description: "The channel you want to mention",
							Required:    true,
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "role",
					Description: "Get the API format for mentioning a role",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionRole,
							Name:        "role",
							Description: "The role you want to mention",
							Required:    true,
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "emoji",
					Description: "Get the API format for a standard or custom emoji",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionString,
							Name:        "emoji",
							Description: "The standard or custom emoji you want to use",
							Required:    true,
						},
					},
				},
			},
		},
		{
			Name:         "image",
			Description:  "Get the image URL for different entities",
			DMPermission: util.Ptr(false),
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "avatar",
					Description: "Get the avatar URL for a user",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionUser,
							Name:        "user",
							Description: "The user you want to get the avatar for",
							Required:    true,
						},
						{
							Type:        discordgo.ApplicationCommandOptionBoolean,
							Name:        "static",
							Description: "Whether animated avatars should be converted to static images",
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "icon",
					Description: "Get the icon URL for this server",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionBoolean,
							Name:        "static",
							Description: "Whether animated icons should be converted to static images",
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "emoji",
					Description: "Get the image URL for a custom or standard emoji",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionUser,
							Name:        "emoji",
							Description: "The custom emoji you want the image URL for",
							Required:    true,
						},
						{
							Type:        discordgo.ApplicationCommandOptionBoolean,
							Name:        "static",
							Description: "Whether animated emojis should be converted to static images",
						},
					},
				},
			},
		},
		{

			Name:        "message",
			Description: "Get JSON for or restore a message on Embed Generator",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "restore",
					Description: "Restore a message on Embed Generator",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionString,
							Name:        "message_id_or_url",
							Description: "ID or URL of the message you want to restore",
							Required:    true,
						},
					},
				},
				{
					Type:        discordgo.ApplicationCommandOptionSubCommand,
					Name:        "dump",
					Description: "Get the JSON code for a message",
					Options: []*discordgo.ApplicationCommandOption{
						{
							Type:        discordgo.ApplicationCommandOptionString,
							Name:        "message_id_or_url",
							Description: "ID or URL of the message you want to restore",
							Required:    true,
						},
					},
				},
			},
		},
		{
			Type: discordgo.MessageApplicationCommand,
			Name: "Restore Message",
		},
		{
			Type: discordgo.MessageApplicationCommand,
			Name: "Dump Message",
		},
		{
			Type: discordgo.UserApplicationCommand,
			Name: "Avatar Url",
		},
	})
	return err
}

func (b *Bot) handleCommandInteraction(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	switch data.Name {
	case "invite":
		return s.InteractionRespond(i, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: "You can invite Embed Generator [here](%s).",
				Flags:   discordgo.MessageFlagsEphemeral,
			},
		})
	case "website":
		return b.handleWebsiteCommand(s, i, data)
	case "help":
		return b.handleHelpCommand(s, i, data)
	case "format":
		return b.handleFormatCommand(s, i, data)
	case "image":
		return b.handleImageCommand(s, i, data)
	case "message":
		return b.handleMessageCommand(s, i, data)
	case "Restore Message":
		return b.handleRestoreContextCommand(s, i, data)
	case "Dump Message":
		return b.handleJSONContextCommand(s, i, data)
	case "Avatar Url":
		return b.handleAvatarUrlContextCommand(s, i, data)
	}
	return nil
}

func (b *Bot) handleHelpCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	return textResponse(s, i, "Help")
}

func (b *Bot) handleInviteCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	return textResponse(s, i, "Invite")
}

func (b *Bot) handleWebsiteCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	return textResponse(s, i, "Website")
}

func (b *Bot) handleFormatCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	subCMD := data.Options[0]

	switch subCMD.Name {
	case "text":
		value := subCMD.Options[0].StringValue()
		return textResponse(s, i, fmt.Sprintf("API format for the provided text: ```%s```", value))
	case "user":
		user := subCMD.Options[0].UserValue(nil)
		return textResponse(s, i, fmt.Sprintf("API format for <@%s>: ```<@%s>```", user.ID, user.ID))
	case "channel":
		channel := subCMD.Options[0].ChannelValue(nil)
		return textResponse(s, i, fmt.Sprintf("API format for <#%s>: ```<#%s>```", channel.ID, channel.ID))
	case "role":
		role := subCMD.Options[0].RoleValue(nil, i.GuildID)
		return textResponse(s, i, fmt.Sprintf("API format for <@&%s>: ```<@&%s>```", role.ID, role.ID))
	case "emoji":
		emoji := subCMD.Options[0].StringValue()
		// TODO
		return textResponse(s, i, fmt.Sprintf("API format for %s: ```%s```", emoji, emoji))
	}

	return nil
}

func (b *Bot) handleImageCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	subCMD := data.Options[0]

	makeStatic := func(url string, option int) string {
		if len(subCMD.Options) <= option {
			return url
		}

		static := subCMD.Options[option].BoolValue()
		if static {
			return strings.Replace(url, ".gif", ".png", 1)
		}

		return url
	}

	switch subCMD.Name {
	case "avatar":
		userID := subCMD.Options[0].UserValue(nil).ID
		user := data.Resolved.Users[userID]

		avatarURL := makeStatic(user.AvatarURL("1024"), 1)
		return imageUrlResponse(s, i, avatarURL)
	case "icon":
		guild, err := b.State.Guild(i.GuildID)
		if err != nil {
			return err
		}
		if guild.Icon == "" {
			return textResponse(s, i, "This server has no icon.")
		}
		iconURL := makeStatic(guild.IconURL("1024"), 1)
		return imageUrlResponse(s, i, iconURL)
	case "emoji":
		// emoji := subCMD.Options[0].StringValue()
		// TODO: get emoji id from regex
	}

	return nil
}

func (b *Bot) handleMessageCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	subCMD := data.Options[0]

	messageID := subCMD.Options[0].StringValue()
	// TODO: regex message url
	message, err := s.ChannelMessage(i.ChannelID, messageID)
	if err != nil {
		if err.(*discordgo.RESTError).Message.Code == discordgo.ErrCodeUnknownMessage {
			return textResponse(s, i, "Message not found.")
		}
		return err
	}

	messageDump, err := json.MarshalIndent(actions.MessageWithActions{
		Username:  message.Author.Username,
		AvatarURL: message.Author.AvatarURL("1024"),
		Content:   message.Content,
		Embeds:    message.Embeds,
		// TODO: Components: message.Components,
	}, "", "  ")
	if err != nil {
		return err
	}

	switch subCMD.Name {
	case "restore":
		paste, err := util.CreateVaultBinPaste(string(messageDump), "json")
		if err != nil {
			log.Error().Err(err).Msg("Failed to create vaultb.in paste")
			return textResponse(s, i, "Failed to create vaultb.in paste.")
		}

		return textResponse(s, i, fmt.Sprintf("You can find the JSON code here: <%s>", paste.URL()))
	case "dump":
		paste, err := util.CreateVaultBinPaste(string(messageDump), "json")
		if err != nil {
			log.Error().Err(err).Msg("Failed to create vaultb.in paste")
			return textResponse(s, i, "Failed to create vaultb.in paste.")
		}

		return textResponse(s, i, fmt.Sprintf("You can find the JSON code here: <%s>", paste.URL()))
	}

	return nil
}

func (b *Bot) handleRestoreContextCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	messageID := data.TargetID
	message := data.Resolved.Messages[messageID]

	messageDump, err := json.MarshalIndent(actions.MessageWithActions{
		Username:  message.Author.Username,
		AvatarURL: message.Author.AvatarURL("1024"),
		Content:   message.Content,
		Embeds:    message.Embeds,
		// TODO: Components: message.Components,
	}, "", "  ")
	if err != nil {
		return err
	}

	paste, err := util.CreateVaultBinPaste(string(messageDump), "json")
	if err != nil {
		log.Error().Err(err).Msg("Failed to create vaultb.in paste")
		return textResponse(s, i, "Failed to create vaultb.in paste.")
	}

	return textResponse(s, i, fmt.Sprintf("You can find the JSON code here: <%s>", paste.URL()))
}

func (b *Bot) handleJSONContextCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	messageID := data.TargetID
	message := data.Resolved.Messages[messageID]

	messageDump, err := json.MarshalIndent(actions.MessageWithActions{
		Username:  message.Author.Username,
		AvatarURL: message.Author.AvatarURL("1024"),
		Content:   message.Content,
		Embeds:    message.Embeds,
		// TODO: Components: message.Components,
	}, "", "  ")
	if err != nil {
		return err
	}

	paste, err := util.CreateVaultBinPaste(string(messageDump), "json")
	if err != nil {
		log.Error().Err(err).Msg("Failed to create vaultb.in paste")
		return textResponse(s, i, "Failed to create vaultb.in paste.")
	}

	return textResponse(s, i, fmt.Sprintf("You can find the JSON code here: <%s>", paste.URL()))
}

func (b *Bot) handleAvatarUrlContextCommand(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ApplicationCommandInteractionData) error {
	userId := data.TargetID
	user := data.Resolved.Users[userId]

	return imageUrlResponse(s, i, user.AvatarURL("1024"))
}

func textResponse(s *discordgo.Session, i *discordgo.Interaction, content string) error {
	return s.InteractionRespond(i, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: content,
			Flags:   discordgo.MessageFlagsEphemeral,
		},
	})
}

func imageUrlResponse(s *discordgo.Session, i *discordgo.Interaction, url string) error {
	return s.InteractionRespond(i, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Flags: discordgo.MessageFlagsEphemeral,
			Embeds: []*discordgo.MessageEmbed{
				{
					Description: url,
					Image: &discordgo.MessageEmbedImage{
						URL: url,
					},
				},
			},
		},
	})
}
