package command

import (
	"fmt"
	"log/slog"
	"regexp"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/handler"
)

func (g *CommandHandler) handleImageAvatarCommand(e *handler.CommandEvent) error {
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
		Flags: discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleImageIconCommand(e *handler.CommandEvent) error {
	static := e.SlashCommandInteractionData().Bool("static")

	guild, ok := e.Guild()
	if !ok {
		slog.Error("Guild for image command is not in cache", slog.Int64("guild_id", int64(*e.GuildID())))
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
		Flags: discord.MessageFlagEphemeral,
	})
}

var emojiRegex = regexp.MustCompile(`<(a?):.+?:(\d{18})>`)
var unicodeEmojiRegex = regexp.MustCompile(`[\x{1F600}-\x{1F64F}]|[\x{1F300}-\x{1F5FF}]|[\x{1F680}-\x{1F6FF}]|[\x{1F1E0}-\x{1F1FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]`)

func (g *CommandHandler) handleImageEmojiCommand(e *handler.CommandEvent) error {
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
		Flags: discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleUserAvatarURLContextCommand(e *handler.CommandEvent) error {
	data := e.UserCommandInteractionData()
	user := data.TargetUser()

	return e.CreateMessage(discord.MessageCreate{
		Embeds: []discord.Embed{
			{
				Description: user.EffectiveAvatarURL(discord.WithSize(1024)),
				Image: &discord.EmbedResource{
					URL: user.EffectiveAvatarURL(discord.WithSize(1024)),
				},
			},
		},
		Flags: discord.MessageFlagEphemeral,
	})
}
