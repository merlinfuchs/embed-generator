package bot

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/merlinfuchs/discordgo"
	"github.com/spf13/viper"
	"github.com/vincent-petithory/dataurl"
)

// GetWebhookForChannel returns the webhook for the given channel.
// If a custom bot is configured for the guild, the webhook will be created by the custom bot.
func (b *Bot) GetWebhookForChannel(channelID string) (*discordgo.Webhook, error) {
	channel, err := b.State.Channel(channelID)
	if err != nil {
		return nil, fmt.Errorf("Failed to get channel: %w", err)
	}

	if channel.Type == discordgo.ChannelTypeGuildNewsThread || channel.Type == discordgo.ChannelTypeGuildPublicThread {
		channel, err = b.State.Channel(channel.ParentID)
		if err != nil {
			return nil, fmt.Errorf("Failed to get parent channel: %w", err)
		}
	}

	customBot, err := b.pg.Q.GetCustomBotByGuildID(context.Background(), channel.GuildID)
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

	webhooks, err := session.ChannelWebhooks(channel.ID)
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
	webhook, err := session.WebhookCreate(channel.ID, username, logoDataURL.String())
	if err != nil {
		return nil, fmt.Errorf("Failed to create webhook: %w", err)
	}

	return webhook, nil
}

// GetSessionForGuild returns the session for the given guild.
// If a custom bot is configured for the guild, the token of the custom bot will be used to create the session.
func (b *Bot) GetSessionForGuild(guildId string) (*discordgo.Session, error) {
	customBot, err := b.pg.Q.GetCustomBotByGuildID(context.Background(), guildId)
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

	return session, nil
}
