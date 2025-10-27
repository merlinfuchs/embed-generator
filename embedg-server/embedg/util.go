package embedg

import (
	"context"
	"database/sql"
	"fmt"

	_ "embed"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres/pgmodel"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

//go:embed logo-512.png
var logoFile []byte

func (g *EmbedGenerator) SendMessageToChannel(ctx context.Context, channelID util.ID, params discord.WebhookMessageCreate) (*discord.Message, error) {
	channel, ok := g.Caches().Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	useCustomBot := false
	customBot, err := g.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID().String())
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

	var newMessage *discord.Message

	if useCustomBot {
		restClient, err := getCustomBotClient(&customBot)
		if err != nil {
			return nil, fmt.Errorf("Failed to create custom bot client: %w", err)
		}

		newMessage, err = restClient.CreateMessage(channelID, discord.MessageCreate{
			Content:         params.Content,
			Embeds:          params.Embeds,
			TTS:             params.TTS,
			Components:      params.Components,
			Files:           params.Files,
			AllowedMentions: params.AllowedMentions,
			Flags:           params.Flags,
		}, rest.WithCtx(ctx))
		if err != nil {
			return nil, fmt.Errorf("Failed to send message: %w", err)
		}
	} else {
		webhook, err := g.findWebhookForChannel(ctx, channelID)
		if err != nil {
			return nil, fmt.Errorf("Failed to find webhook: %w", err)
		}

		var threadID util.ID
		if webhook.ChannelID != channelID {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channelID
		}

		newMessage, err = g.Rest().CreateWebhookMessage(webhook.ID(), webhook.Token, params, rest.CreateWebhookMessageParams{
			Wait:           true,
			ThreadID:       threadID,
			WithComponents: true,
		}, rest.WithCtx(ctx))
		if err != nil {
			return nil, fmt.Errorf("Failed to send message: %w", err)
		}
	}

	return newMessage, nil
}

func (g *EmbedGenerator) UpdateMessageInChannel(ctx context.Context, channelID util.ID, messageID util.ID, params discord.WebhookMessageUpdate) (*discord.Message, error) {
	channel, ok := g.Caches().Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	useCustomBot := false
	customBot, err := g.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID().String())
	if err != nil {
		if err != sql.ErrNoRows {
			log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
		}
	}

	msg, err := g.Rest().GetMessage(channelID, messageID, rest.WithCtx(ctx))
	if err != nil {
		if util.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMessage) {
			return nil, fmt.Errorf("Message not found")
		}
		return nil, fmt.Errorf("Failed to get message from channel: %w", err)
	}

	if msg.WebhookID == nil {
		if msg.Author.ID.String() == customBot.UserID {
			useCustomBot = true
		} else {
			return nil, fmt.Errorf("Message wasn't sent by a webhook and can therefore not be edited.")
		}
	}

	var newMessage *discord.Message

	if useCustomBot {
		restClient, err := getCustomBotClient(&customBot)
		if err != nil {
			return nil, fmt.Errorf("Failed to create custom bot client: %w", err)
		}

		newMessage, err = restClient.UpdateMessage(channelID, messageID, discord.MessageUpdate{
			Content:         params.Content,
			Embeds:          params.Embeds,
			Components:      params.Components,
			Files:           params.Files,
			AllowedMentions: params.AllowedMentions,
			Attachments:     params.Attachments,
		}, rest.WithCtx(ctx))
		if err != nil {
			return nil, fmt.Errorf("Failed to edt message: %w", err)
		}
	} else {
		webhook, err := g.getWebhookForChannel(ctx, channelID, *msg.WebhookID)
		if err != nil {
			return nil, fmt.Errorf("Failed to get webhook: %w", err)
		}

		var threadID util.ID
		if webhook.ChannelID != channelID {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channelID
		}

		newMessage, err = g.Rest().UpdateWebhookMessage(webhook.ID(), webhook.Token, messageID, params, rest.UpdateWebhookMessageParams{
			ThreadID:       threadID,
			WithComponents: true,
		}, rest.WithCtx(ctx))
		if err != nil {
			return nil, fmt.Errorf("Failed to edit message: %w", err)
		}
	}

	return newMessage, nil
}

func (g *EmbedGenerator) findWebhookForChannel(ctx context.Context, channelID util.ID) (*discord.IncomingWebhook, error) {
	channel, ok := g.Caches().Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	if channel.Type() == discord.ChannelTypeGuildNewsThread || channel.Type() == discord.ChannelTypeGuildPublicThread || channel.Type() == discord.ChannelTypeGuildPrivateThread {
		channel, ok = g.Caches().Channel(*channel.ParentID())
		if !ok {
			return nil, fmt.Errorf("parent channel not found in cache")
		}
	}

	customBot, err := g.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID().String())
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("Failed to get custom bot: %w", err)
	}

	restClient := g.Rest()
	if customBot.Token != "" {
		restClient, err = getCustomBotClient(&customBot)
		if err != nil {
			return nil, fmt.Errorf("Failed to create custom bot client: %w", err)
		}
	}

	webhooks, err := restClient.GetWebhooks(channel.ID(), rest.WithCtx(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to list webhooks: %w", err)
	}

	clientID := util.ToID(viper.GetString("discord.client_id"))
	if customBot.ApplicationID != "" {
		clientID = util.ToID(customBot.ApplicationID)
	}

	for _, webhook := range webhooks {
		incomingWebhook, ok := webhook.(*discord.IncomingWebhook)
		if !ok {
			continue
		}
		if incomingWebhook.ApplicationID != nil && *incomingWebhook.ApplicationID != clientID {
			return incomingWebhook, nil
		}
	}

	username := "Embed Generator"
	if customBot.UserName != "" {
		username = customBot.UserName
	}

	webhook, err := restClient.CreateWebhook(channel.ID(), discord.WebhookCreate{
		Name:   username,
		Avatar: discord.NewIconRaw(discord.IconTypePNG, logoFile),
	}, rest.WithCtx(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to create webhook: %w", err)
	}

	return webhook, nil
}

func (g *EmbedGenerator) getWebhookForChannel(ctx context.Context, channelID util.ID, webhookID snowflake.ID) (*discord.IncomingWebhook, error) {
	channel, ok := g.Caches().Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	if channel.Type() == discord.ChannelTypeGuildNewsThread || channel.Type() == discord.ChannelTypeGuildPublicThread || channel.Type() == discord.ChannelTypeGuildPrivateThread {
		channel, ok = g.Caches().Channel(*channel.ParentID())
		if !ok {
			return nil, fmt.Errorf("parent channel not found in cache")
		}
	}

	webhooks, err := g.Rest().GetWebhooks(channel.ID(), rest.WithCtx(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to list webhooks: %w", err)
	}

	var webhook *discord.IncomingWebhook

	for _, w := range webhooks {
		if w.ID() == webhookID {
			webhook, _ = w.(*discord.IncomingWebhook)
		}
	}

	// We have found the webhook, but it belongs to another application
	// so let's try with the custom bot session if any
	if webhook != nil && webhook.Token == "" {
		customBot, err := g.pg.Q.GetCustomBotByGuildID(ctx, channel.GuildID().String())
		if err != nil && err != sql.ErrNoRows {
			return nil, fmt.Errorf("Failed to get custom bot: %w", err)
		}

		if customBot.Token != "" {
			restClient, err := getCustomBotClient(&customBot)
			if err != nil {
				return nil, fmt.Errorf("Failed to create custom bot rest client: %w", err)
			}

			webhooks, err := restClient.GetWebhooks(channel.ID(), rest.WithCtx(ctx))
			if err != nil {
				return nil, fmt.Errorf("Failed to get webhooks: %w", err)
			}

			for _, w := range webhooks {
				if w.ID() == webhookID {
					webhook, _ = w.(*discord.IncomingWebhook)
				}
			}
		}
	}

	if webhook == nil {
		return nil, fmt.Errorf("No webhook found that matches the given ID.")
	}

	if webhook.Token == "" {
		return nil, fmt.Errorf("The webhook belongs to another application and can't be used by Embed Generator.")
	}

	return webhook, nil
}

func getCustomBotClient(b *pgmodel.CustomBot) (rest.Rest, error) {
	if b.Token == "" {
		return nil, fmt.Errorf("No token available for custom bot")
	}

	restClient := rest.New(rest.NewClient(b.Token))
	return restClient, nil
}
