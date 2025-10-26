package embedg

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"regexp"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/handler"
	"github.com/disgoorg/disgo/handler/middleware"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/omit"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/spf13/viper"
)

var commands = []discord.ApplicationCommandCreate{
	discord.SlashCommandCreate{
		Name:        "help",
		Description: "Show help",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
			discord.ApplicationIntegrationTypeUserInstall,
		},
	},
	discord.SlashCommandCreate{
		Name:        "invite",
		Description: "Invite the Embed Generator bot to your server",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
		},
	},
	discord.SlashCommandCreate{
		Name:        "website",
		Description: "Open the Embed Generator website",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
			discord.ApplicationIntegrationTypeUserInstall,
		},
	},
	discord.SlashCommandCreate{
		Name:        "format",
		Description: "Get the API format for mentions, channels, roles, & custom emojis",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
			discord.ApplicationIntegrationTypeUserInstall,
		},
		Options: []discord.ApplicationCommandOption{
			discord.ApplicationCommandOptionSubCommand{
				Name:        "text",
				Description: "Get the API format for a text with multiple mentions, channels, & custom emojis",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionString{
						Name:        "text",
						Description: "The text that you want to format (usually containing mentions or custom emojis)",
						Required:    true,
					},
				},
			},
			discord.ApplicationCommandOptionSubCommand{
				Name:        "user",
				Description: "Get the API format for mentioning a user",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionUser{
						Name:        "user",
						Description: "The user you want to mention",
						Required:    true,
					},
				},
			},
			discord.ApplicationCommandOptionSubCommand{
				Name:        "channel",
				Description: "Get the API format for mentioning a channel",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionChannel{
						Name:        "channel",
						Description: "The channel you want to mention",
						Required:    true,
					},
				},
			},
			discord.ApplicationCommandOptionSubCommand{
				Name:        "role",
				Description: "Get the API format for mentioning a role",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionRole{
						Name:        "role",
						Description: "The role you want to mention",
						Required:    true,
					},
				},
			},
			discord.ApplicationCommandOptionSubCommand{
				Name:        "emoji",
				Description: "Get the API format for a standard or custom emoji",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionString{
						Name:        "emoji",
						Description: "The standard or custom emoji you want to use",
						Required:    true,
					},
				},
			},
		},
	},
	discord.SlashCommandCreate{
		Name:        "image",
		Description: "Get the image URL for different entities",
		Contexts: []discord.InteractionContextType{
			discord.InteractionContextTypeGuild,
		},
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
		},
		Options: []discord.ApplicationCommandOption{
			discord.ApplicationCommandOptionSubCommand{
				Name:        "avatar",
				Description: "Get the avatar URL for a user",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionUser{
						Name:        "user",
						Description: "The user you want to get the avatar for",
						Required:    true,
					},
					discord.ApplicationCommandOptionBool{
						Name:        "static",
						Description: "Whether animated avatars should be converted to static images",
					},
				},
			},
			discord.ApplicationCommandOptionSubCommand{
				Name:        "icon",
				Description: "Get the icon URL for this server",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionBool{
						Name:        "static",
						Description: "Whether animated icons should be converted to static images",
					},
				},
			},
			discord.ApplicationCommandOptionSubCommand{
				Name:        "emoji",
				Description: "Get the image URL for a custom or standard emoji",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionString{
						Name:        "emoji",
						Description: "The standard or custom emoji you want the image URL for",
						Required:    true,
					},
					discord.ApplicationCommandOptionBool{
						Name:        "static",
						Description: "Whether animated emojis should be converted to static images",
					},
				},
			},
		},
	},
	discord.SlashCommandCreate{

		Name:        "message",
		Description: "Get JSON for or restore a message on Embed Generator",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
		},
		Options: []discord.ApplicationCommandOption{
			discord.ApplicationCommandOptionSubCommand{
				Name:        "restore",
				Description: "Restore a message on Embed Generator",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionString{
						Name:        "message_id_or_url",
						Description: "ID or URL of the message you want to restore",
						Required:    true,
					},
				},
			},
			discord.ApplicationCommandOptionSubCommand{
				Name:        "dump",
				Description: "Get the JSON code for a message",
				Options: []discord.ApplicationCommandOption{
					discord.ApplicationCommandOptionString{
						Name:        "message_id_or_url",
						Description: "ID or URL of the message you want to restore",
						Required:    true,
					},
				},
			},
		},
	},
	discord.MessageCommandCreate{
		Name: "Restore Message",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
			discord.ApplicationIntegrationTypeUserInstall,
		},
	},
	discord.MessageCommandCreate{
		Name: "Dump Message",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
			discord.ApplicationIntegrationTypeUserInstall,
		},
	},
	discord.UserCommandCreate{
		Name: "Avatar Url",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
			discord.ApplicationIntegrationTypeUserInstall,
		},
	},
	discord.UserCommandCreate{
		Name: "Format Mention",
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
			discord.ApplicationIntegrationTypeUserInstall,
		},
	},
	discord.SlashCommandCreate{
		Name:                     "embed",
		Description:              "Create an embed message",
		DefaultMemberPermissions: omit.NewPtr(discord.PermissionManageWebhooks),
		Contexts: []discord.InteractionContextType{
			discord.InteractionContextTypeGuild,
		},
		IntegrationTypes: []discord.ApplicationIntegrationType{
			discord.ApplicationIntegrationTypeGuildInstall,
		},
	},
}

func (g *EmbedGenerator) SyncCommands() error {
	if err := handler.SyncCommands(g.Client(), commands, []snowflake.ID{}); err != nil {
		return fmt.Errorf("error while syncing commands: %w", err)
	}
	return nil
}

func (g *EmbedGenerator) registerHandlers() {
	r := g.clientRouter

	r.Use(middleware.Logger)
	r.Command("/invite", g.handleHelpCommand)
	r.Command("/website", g.handleHelpCommand)
	r.Command("/help", g.handleHelpCommand)

	r.Route("/format", func(r handler.Router) {
		r.Command("/text", g.handleFormatTextCommand)
		r.Command("/user", g.handleFormatUserCommand)
		r.Command("/channel", g.handleFormatChannelCommand)
		r.Command("/role", g.handleFormatRoleCommand)
		r.Command("/emoji", g.handleFormatEmojiCommand)
	})

	r.Route("/image", func(r handler.Router) {
		r.Command("/avatar", g.handleImageAvatarCommand)
		r.Command("/icon", g.handleImageIconCommand)
		r.Command("/emoji", g.handleImageEmojiCommand)
	})

	r.Route("/message", func(r handler.Router) {
		r.Command("/restore", g.handleMessageRestoreCommand)
		r.Command("/dump", g.handleMessageDumpCommand)
	})

	r.Command("/Restore Message", g.handleMessageRestoreContextCommand)
	r.Command("/Dump Message", g.handleMessageDumpContextCommand)

	r.Command("/Avatar Url", g.handleUserAvatarURLContextCommand)
	r.Command("/Format Mention", g.handleUserFormatMentionContextCommand)

	r.Command("/embed", g.handleEmbedCommand)
}

func (g *EmbedGenerator) handleHelpCommand(e *handler.CommandEvent) error {
	return e.CreateMessage(discord.MessageCreate{
		Content: "**The best way to generate rich embed messages for your Discord Server!**\n\nhttps://www.youtube.com/watch?v=DnFP0MRJPIg",
		Components: []discord.LayoutComponent{
			discord.ActionRowComponent{
				Components: []discord.InteractiveComponent{
					discord.ButtonComponent{
						Style: discord.ButtonStyleLink,
						Label: "Website",
						URL:   "https://message.style",
					},
					discord.ButtonComponent{
						Style: discord.ButtonStyleLink,
						Label: "Invite Bot",
						URL:   util.BotInviteURL(),
					},
					discord.ButtonComponent{
						Style: discord.ButtonStyleLink,
						Label: "Discord Server",
						URL:   viper.GetString("links.discord"),
					},
				},
			},
		},
	})
}

func (g *EmbedGenerator) handleFormatTextCommand(e *handler.CommandEvent) error {
	value := e.SlashCommandInteractionData().String("text")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for the provided text: ```%s```", value),
	})
}

func (g *EmbedGenerator) handleFormatUserCommand(e *handler.CommandEvent) error {
	user := e.SlashCommandInteractionData().User("user")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for %s: ```<@%s>```", user.Mention(), user.ID),
	})
}

func (g *EmbedGenerator) handleFormatChannelCommand(e *handler.CommandEvent) error {
	channel := e.SlashCommandInteractionData().Channel("channel")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for <#%s>: ```<#%s>```", channel.ID, channel.ID),
	})
}

func (g *EmbedGenerator) handleFormatRoleCommand(e *handler.CommandEvent) error {
	role := e.SlashCommandInteractionData().Role("role")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for %s: ```<@&%s>```", role.Mention(), role.ID),
	})
}

func (g *EmbedGenerator) handleFormatEmojiCommand(e *handler.CommandEvent) error {
	emoji := e.SlashCommandInteractionData().String("emoji")

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("API format for %s: ```%s```", emoji, emoji),
	})
}

func (g *EmbedGenerator) handleImageAvatarCommand(e *handler.CommandEvent) error {
	user := e.SlashCommandInteractionData().User("user")
	static := e.SlashCommandInteractionData().Bool("static")

	opts := []discord.CDNOpt{
		discord.WithSize(1024),
	}
	if static {
		opts = append(opts, discord.WithFormat(discord.FileFormatPNG))
	}

	avatarURL := user.EffectiveAvatarURL(opts...)

	return e.CreateMessage(discord.MessageCreate{
		Embeds: []discord.Embed{
			{
				Description: avatarURL,
				Image: &discord.EmbedResource{
					URL: avatarURL,
				},
			},
		},
	})
}

func (g *EmbedGenerator) handleImageIconCommand(e *handler.CommandEvent) error {
	static := e.SlashCommandInteractionData().Bool("static")

	guild, ok := e.Guild()
	if !ok {
		slog.Error(
			"Guild for image command is not in cache",
			slog.Uint64("guild_id", uint64(*e.GuildID())),
		)
		return e.CreateMessage(discord.MessageCreate{
			Content: "Server is not in cache, please report this!",
		})
	}

	opts := []discord.CDNOpt{
		discord.WithSize(1024),
	}
	if static {
		opts = append(opts, discord.WithFormat(discord.FileFormatPNG))
	}

	iconURL := guild.IconURL(opts...)
	if iconURL == nil {
		return e.CreateMessage(discord.MessageCreate{
			Content: "This server doesn't have an icon.",
		})
	}

	return e.CreateMessage(discord.MessageCreate{
		Embeds: []discord.Embed{
			{
				Description: *iconURL,
				Image: &discord.EmbedResource{
					URL: *iconURL,
				},
			},
		},
	})
}

var emojiRegex = regexp.MustCompile(`<(a?):.+?:(\d{18})>`)
var unicodeEmojiRegex = regexp.MustCompile(`[\x{1F600}-\x{1F64F}]|[\x{1F300}-\x{1F5FF}]|[\x{1F680}-\x{1F6FF}]|[\x{1F1E0}-\x{1F1FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]`)

func (g *EmbedGenerator) handleImageEmojiCommand(e *handler.CommandEvent) error {
	rawEmoji := e.SlashCommandInteractionData().String("emoji")
	static := e.SlashCommandInteractionData().Bool("static")

	// Check if it's a unicode emoji
	if unicodeEmojiRegex.MatchString(rawEmoji) {
		emojiURL := emojiImageURL(rawEmoji, false)

		return e.CreateMessage(discord.MessageCreate{
			Embeds: []discord.Embed{
				{
					Description: emojiURL,
					Image: &discord.EmbedResource{
						URL: emojiURL,
					},
				},
			},
		})
	}

	// Parse Discord emoji
	matches := emojiRegex.FindStringSubmatch(rawEmoji)
	if len(matches) < 2 {
		return e.CreateMessage(discord.MessageCreate{
			Content: "Invalid emoji format. Please use a custom Discord emoji like `<:name:id>` or `<a:name:id>`.",
		})
	}

	emojiID := matches[2]
	isAnimated := matches[1] == "a"

	// Build the URL
	extension := "gif"
	if static || !isAnimated {
		extension = "png"
	}

	emojiURL := fmt.Sprintf("https://cdn.discordapp.com/emojis/%s.%s", emojiID, extension)

	return e.CreateMessage(discord.MessageCreate{
		Embeds: []discord.Embed{
			{
				Description: emojiURL,
				Image: &discord.EmbedResource{
					URL: emojiURL,
				},
			},
		},
	})
}

var messageURLRegex = regexp.MustCompile(`https?://(?:canary\\.|ptb\\.)?discord\\.com/channels/[0-9]+/([0-9]+)/([0-9]+)`)
var messageIDRegex = regexp.MustCompile(`^[0-9]+$`)

func (g *EmbedGenerator) handleMessageRestoreCommand(e *handler.CommandEvent) error {
	messageIDOrURL := e.SlashCommandInteractionData().String("message_id_or_url")

	channelID := e.Channel().ID()
	var messageID snowflake.ID

	match := messageURLRegex.FindStringSubmatch(messageIDOrURL)
	if match != nil {
		channelID, _ = snowflake.Parse(match[1])
		messageID, _ = snowflake.Parse(match[2])

		channel, ok := g.Client().Caches.Channel(channelID)
		if !ok {
			return e.CreateMessage(discord.MessageCreate{
				Content: "The message belongs to a channel that the bot doesn't have access to.",
			})
		}

		if channel.GuildID() != *e.GuildID() {
			return e.CreateMessage(discord.MessageCreate{
				Content: "The channel doesn't belong to this server.",
			})
		}
	}

	message, err := g.Client().Rest.GetMessage(channelID, messageID, rest.WithCtx(g.ctx))
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMessage) {
			return e.CreateMessage(discord.MessageCreate{
				Content: "Message not found.",
			})
		}

		return e.CreateMessage(discord.MessageCreate{
			Content: "Failed to get message.",
		})
	}

	// TODO: Unparse components

	messageDump, err := json.MarshalIndent(actions.MessageWithActions{
		Username: message.Author.Username,
		// AvatarURL:  message.Author.AvatarURL("1024"),
		Content: message.Content,
		// Embeds:     message.Embeds,
	}, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal message dump: %w", err)
	}

	fmt.Println(messageDump)

	return nil
}

func (g *EmbedGenerator) handleMessageRestoreContextCommand(e *handler.CommandEvent) error {
	return nil
}

func (g *EmbedGenerator) handleMessageDumpCommand(e *handler.CommandEvent) error {
	return nil
}

func (g *EmbedGenerator) handleMessageDumpContextCommand(e *handler.CommandEvent) error {
	return nil
}

func (g *EmbedGenerator) handleUserAvatarURLContextCommand(e *handler.CommandEvent) error {
	return nil
}

func (g *EmbedGenerator) handleUserFormatMentionContextCommand(e *handler.CommandEvent) error {
	return nil
}

func (g *EmbedGenerator) handleEmbedCommand(e *handler.CommandEvent) error {
	return nil
}
