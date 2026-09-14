package command

import (
	"context"
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/omit"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
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

func (g *CommandHandler) SyncCommands(ctx context.Context) error {
	return SyncCommands(ctx, g.rest, g.appContext)
}

func SyncCommands(ctx context.Context, restClient rest.Rest, appContext store.AppContext) error {
	_, err := restClient.SetGlobalCommands(appContext.ApplicationID(), commands, rest.WithCtx(ctx))
	if err != nil {
		return fmt.Errorf("error while syncing commands: %w", err)
	}
	return nil
}
