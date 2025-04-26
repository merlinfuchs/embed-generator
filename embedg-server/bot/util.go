package bot

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
	"github.com/vincent-petithory/dataurl"
)

// SendMessageToChannel sends a message to a channel, either using a webhook or using the configured custom bot.
func (b *Bot) SendMessageToChannel(ctx context.Context, channelID string, params *discordgo.WebhookParams) (*discordgo.Message, error) {
	channel, err := b.State.Channel(channelID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get channel: %w", err)
	}

	useCustomBot := false
	customBot, err := b.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
		}
	} else if params.Username == "" && params.AvatarURL == "" {
		useCustomBot = true
	} else {
		if params.Username == "" {
			params.Username = customBot.UserName
		}
		if params.AvatarURL == "" {
			params.AvatarURL = util.DiscordAvatarURL(customBot.UserID, customBot.UserDiscriminator, customBot.UserAvatar.String)
		}
	}

	var newMessage *discordgo.Message

	if useCustomBot {
		session, err := getCustomBotSession(&customBot)
		if err != nil {
			return nil, fmt.Errorf("Failed to create custom bot session: %w", err)
		}

		newMessage, err = session.ChannelMessageSendComplex(channelID, &discordgo.MessageSend{
			Content:         params.Content,
			Embeds:          params.Embeds,
			TTS:             params.TTS,
			Components:      params.Components,
			Files:           params.Files,
			AllowedMentions: params.AllowedMentions,
			Flags:           params.Flags,
		}, discordgo.WithContext(ctx))
		if err != nil {
			return nil, fmt.Errorf("Failed to send message: %w", err)
		}
	} else {
		webhook, err := b.FindWebhookForChannel(ctx, channelID)
		if err != nil {
			return nil, fmt.Errorf("Failed to find webhook: %w", err)
		}

		threadID := ""
		if webhook.ChannelID != channelID {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channelID
		}

		if threadID != "" {
			newMessage, err = b.Session.WebhookThreadExecute(
				webhook.ID,
				webhook.Token,
				true,
				threadID,
				params,
				discordgo.WithContext(ctx),
			)
		} else {
			newMessage, err = b.Session.WebhookExecute(
				webhook.ID,
				webhook.Token,
				true,
				params,
				discordgo.WithContext(ctx),
			)
		}
		if err != nil {
			return nil, fmt.Errorf("Failed to send message: %w", err)
		}
	}

	return newMessage, nil
}

// EditMessageInChannel edits a message in a channel, either sent by a webhook or by the configured custom bot.
func (b *Bot) EditMessageInChannel(ctx context.Context, channelID string, messageID string, params *discordgo.WebhookEdit) (*discordgo.Message, error) {
	channel, err := b.State.Channel(channelID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get channel: %w", err)
	}

	useCustomBot := false
	customBot, err := b.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID)
	if err != nil {
		if err != sql.ErrNoRows {
			log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
		}
	}

	msg, err := b.Session.ChannelMessage(channelID, messageID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get message from channel: %w", err)
	}

	if msg.WebhookID == "" {
		if msg.Author.ID == customBot.UserID {
			useCustomBot = true
		} else {
			return nil, fmt.Errorf("Message wasn't sent by a webhook and can therefore not be edited.")
		}
	}

	var newMessage *discordgo.Message

	if useCustomBot {
		session, err := getCustomBotSession(&customBot)
		if err != nil {
			return nil, fmt.Errorf("Failed to create custom bot session: %w", err)
		}

		newMessage, err = session.ChannelMessageEditComplex(&discordgo.MessageEdit{
			Channel:         channelID,
			ID:              messageID,
			Content:         params.Content,
			Embeds:          params.Embeds,
			Components:      params.Components,
			Files:           params.Files,
			AllowedMentions: params.AllowedMentions,
			Attachments:     params.Attachments,
		}, discordgo.WithContext(ctx))
		if err != nil {
			return nil, fmt.Errorf("Failed to edt message: %w", err)
		}
	} else {
		webhook, err := b.GetWebhookForChannel(ctx, channelID, msg.WebhookID)
		if err != nil {
			return nil, fmt.Errorf("Failed to get webhook: %w", err)
		}

		threadID := ""
		if webhook.ChannelID != channelID {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channelID
		}

		if threadID != "" {
			newMessage, err = b.Session.WebhookThreadMessageEdit(
				webhook.ID,
				webhook.Token,
				threadID,
				messageID,
				params,
				discordgo.WithContext(ctx),
			)
		} else {
			newMessage, err = b.Session.WebhookMessageEdit(
				webhook.ID,
				webhook.Token,
				messageID,
				params,
				discordgo.WithContext(ctx),
			)
		}
		if err != nil {
			return nil, fmt.Errorf("Failed to edit message: %w", err)
		}
	}

	return newMessage, nil
}

// FindWebhookForChannel returns a webhook for the given channel that was created by the bot or the configured custom bot.
func (b *Bot) FindWebhookForChannel(ctx context.Context, channelID string) (*discordgo.Webhook, error) {
	channel, err := b.State.Channel(channelID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get channel: %w", err)
	}

	if channel.Type == discordgo.ChannelTypeGuildNewsThread || channel.Type == discordgo.ChannelTypeGuildPublicThread || channel.Type == discordgo.ChannelTypeGuildPrivateThread {
		channel, err = b.State.Channel(channel.ParentID)
		if err != nil {
			return nil, fmt.Errorf("Failed to get parent channel: %w", err)
		}
	}

	customBot, err := b.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("Failed to get custom bot: %w", err)
	}

	session := b.Session
	if customBot.Token != "" {
		session, err = discordgo.New("Bot " + customBot.Token)
		if err != nil {
			return nil, fmt.Errorf("Failed to create custom bot session: %w", err)
		}
	}

	webhooks, err := session.ChannelWebhooks(channel.ID, discordgo.WithContext(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to get webhooks: %w", err)
	}

	clientID := viper.GetString("discord.client_id")
	if customBot.ApplicationID != "" {
		clientID = customBot.ApplicationID
	}

	for _, webhook := range webhooks {
		if webhook.ApplicationID == clientID {
			return webhook, nil
		}
	}

	username := "Embed Generator"
	if customBot.UserName != "" {
		username = customBot.UserName
	}

	logoDataURL := dataurl.New(logoFile, "image/png")
	webhook, err := session.WebhookCreate(channel.ID, username, logoDataURL.String(), discordgo.WithContext(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to create webhook: %w", err)
	}

	return webhook, nil
}

// GetWebhookForChannel returns the webhook for the given channel if available.
func (b *Bot) GetWebhookForChannel(ctx context.Context, channelID string, webhookID string) (*discordgo.Webhook, error) {
	channel, err := b.State.Channel(channelID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get channel: %w", err)
	}

	if channel.Type == discordgo.ChannelTypeGuildNewsThread || channel.Type == discordgo.ChannelTypeGuildPublicThread || channel.Type == discordgo.ChannelTypeGuildPrivateThread {
		channel, err = b.State.Channel(channel.ParentID)
		if err != nil {
			return nil, fmt.Errorf("Failed to get parent channel: %w", err)
		}
	}

	var webhook *discordgo.Webhook

	// First retrieve the webhooks with the main bot session
	webhooks, err := b.Session.ChannelWebhooks(channel.ID, discordgo.WithContext(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to get webhooks: %w", err)
	}

	for _, w := range webhooks {
		if w.ID == webhookID {
			webhook = w
		}
	}

	// We haven't found the webhook yet, so let's try with the custom bot session if any
	if webhook == nil || webhook.Token == "" {
		customBot, err := b.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID)
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("Failed to get custom bot: %w", err)
		}

		if customBot.Token != "" {
			session, err := discordgo.New("Bot " + customBot.Token)
			if err != nil {
				return nil, fmt.Errorf("Failed to create custom bot session: %w", err)
			}

			webhooks, err := session.ChannelWebhooks(channel.ID, discordgo.WithContext(ctx))
			if err != nil {
				return nil, fmt.Errorf("Failed to get webhooks: %w", err)
			}

			for _, w := range webhooks {
				if w.ID == webhookID {
					webhook = w
				}
			}
		}
	}

	if webhook == nil {
		return nil, fmt.Errorf("The webhook doesn't exist.")
	}

	if webhook.Token == "" {
		return nil, fmt.Errorf("The webhook belongs to another application and can't be used by Embed Generator.")
	}

	return webhook, nil
}

// GetSessionForGuild returns the session for the given guild.
// If a custom bot is configured for the guild, the token of the custom bot will be used to create the session.
func (b *Bot) GetSessionForGuild(ctx context.Context, guildId string) (*discordgo.Session, error) {
	customBot, err := b.pg.Q.GetCustomBotByGuildID(ctx, guildId)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("Failed to get custom bot: %w", err)
	}

	session := b.Session
	if customBot.Token != "" {
		return getCustomBotSession(&customBot)
	}

	return session, nil
}

func getCustomBotSession(b *pgmodel.CustomBot) (*discordgo.Session, error) {
	if b.Token == "" {
		return nil, fmt.Errorf("No token available for custom bot")
	}

	session, err := discordgo.New("Bot " + b.Token)
	if err != nil {
		return nil, fmt.Errorf("Failed to create custom bot session: %w", err)
	}

	return session, nil
}
