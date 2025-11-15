package webhook

import (
	"context"
	"fmt"

	_ "embed"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/rs/zerolog/log"
)

//go:embed logo-512.png
var logoFile []byte

func (m *WebhookManager) SendMessageToChannel(ctx context.Context, channelID common.ID, params discord.WebhookMessageCreate) (*discord.Message, error) {
	channel, ok := m.caches.Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	useCustomBot := false
	restClient, customBot, err := m.customBotManager.GetRestForGuild(ctx, channel.GuildID())
	if err != nil {
		log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
	} else if customBot != nil && params.Username == "" && params.AvatarURL == "" {
		useCustomBot = true
	} else if customBot != nil {
		if params.Username == "" {
			params.Username = customBot.UserName
		}
		if params.AvatarURL == "" {
			params.AvatarURL = common.DiscordAvatarURL(customBot.UserID, customBot.UserDiscriminator, customBot.UserAvatar.String)
		}
	}

	var newMessage *discord.Message

	if useCustomBot {
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
		webhook, err := m.findWebhookForChannel(ctx, channelID)
		if err != nil {
			return nil, fmt.Errorf("Failed to find webhook: %w", err)
		}

		var threadID common.ID
		if webhook.ChannelID != channelID {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channelID
		}

		newMessage, err = restClient.CreateWebhookMessage(webhook.ID(), webhook.Token, params, rest.CreateWebhookMessageParams{
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

func (m *WebhookManager) UpdateMessageInChannel(ctx context.Context, channelID common.ID, messageID common.ID, params discord.WebhookMessageUpdate) (*discord.Message, error) {
	channel, ok := m.caches.Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	useCustomBot := false
	restClient, customBot, err := m.customBotManager.GetRestForGuild(ctx, channel.GuildID())
	if err != nil {
		log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
	}

	msg, err := restClient.GetMessage(channelID, messageID, rest.WithCtx(ctx))
	if err != nil {
		if common.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMessage) {
			return nil, fmt.Errorf("Message not found")
		}
		return nil, fmt.Errorf("Failed to get message from channel: %w", err)
	}

	if msg.WebhookID == nil {
		if customBot != nil && msg.Author.ID == customBot.UserID {
			useCustomBot = true
		} else {
			return nil, fmt.Errorf("Message wasn't sent by a webhook and can therefore not be edited.")
		}
	}

	var newMessage *discord.Message

	if useCustomBot {
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
		webhook, err := m.getWebhookForChannel(ctx, channelID, *msg.WebhookID)
		if err != nil {
			return nil, fmt.Errorf("Failed to get webhook: %w", err)
		}

		var threadID common.ID
		if webhook.ChannelID != channelID {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channelID
		}

		newMessage, err = restClient.UpdateWebhookMessage(webhook.ID(), webhook.Token, messageID, params, rest.UpdateWebhookMessageParams{
			ThreadID:       threadID,
			WithComponents: true,
		}, rest.WithCtx(ctx))
		if err != nil {
			return nil, fmt.Errorf("Failed to edit message: %w", err)
		}
	}

	return newMessage, nil
}

func (m *WebhookManager) findWebhookForChannel(ctx context.Context, channelID common.ID) (*discord.IncomingWebhook, error) {
	channel, ok := m.caches.Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	if channel.Type() == discord.ChannelTypeGuildNewsThread || channel.Type() == discord.ChannelTypeGuildPublicThread || channel.Type() == discord.ChannelTypeGuildPrivateThread {
		channel, ok = m.caches.Channel(*channel.ParentID())
		if !ok {
			return nil, fmt.Errorf("parent channel not found in cache")
		}
	}

	restClient, customBot, err := m.customBotManager.GetRestForGuild(ctx, channel.GuildID())
	if err != nil {
		return nil, fmt.Errorf("Failed to get custom bot: %w", err)
	}

	webhooks, err := restClient.GetWebhooks(channel.ID(), rest.WithCtx(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to list webhooks: %w", err)
	}

	for _, webhook := range webhooks {
		incomingWebhook, ok := webhook.(discord.IncomingWebhook)
		if !ok {
			continue
		}
		if incomingWebhook.ApplicationID != nil && incomingWebhook.Token != "" {
			return &incomingWebhook, nil
		}
	}

	username := "Embed Generator"
	if customBot != nil {
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

func (m *WebhookManager) getWebhookForChannel(ctx context.Context, channelID common.ID, webhookID common.ID) (*discord.IncomingWebhook, error) {
	channel, ok := m.caches.Channel(channelID)
	if !ok {
		return nil, fmt.Errorf("channel not found in cache")
	}

	if channel.Type() == discord.ChannelTypeGuildNewsThread || channel.Type() == discord.ChannelTypeGuildPublicThread || channel.Type() == discord.ChannelTypeGuildPrivateThread {
		channel, ok = m.caches.Channel(*channel.ParentID())
		if !ok {
			return nil, fmt.Errorf("parent channel not found in cache")
		}
	}

	// First try to get the webhook with the default rest client
	webhook, err := m.getWebhookForChannelWithRestClient(ctx, channelID, webhookID, m.rest)
	if err != nil {
		return nil, fmt.Errorf("Failed to get webhook: %w", err)
	}

	if webhook != nil && webhook.Token != "" {
		return webhook, nil
	}

	if webhook != nil {
		// The webhook was found, but it belongs to another application
		// so let's try with the custom bot session if any
		restClient, customBot, err := m.customBotManager.GetRestForGuild(ctx, channel.GuildID())
		if err != nil {
			return nil, fmt.Errorf("Failed to get custom bot: %w", err)
		}

		if customBot != nil {
			webhook, err := m.getWebhookForChannelWithRestClient(ctx, channelID, webhookID, restClient)
			if err != nil {
				return nil, fmt.Errorf("Failed to get webhook: %w", err)
			}

			if webhook != nil && webhook.Token != "" {
				return webhook, nil
			} else if webhook != nil {
				return nil, fmt.Errorf("The webhook belongs to another application and can't be used by Embed Generator.")
			}
		}
	}

	return nil, fmt.Errorf("No webhook found that matches the given ID.")
}

func (m *WebhookManager) getWebhookForChannelWithRestClient(ctx context.Context, channelID common.ID, webhookID common.ID, restClient rest.Rest) (*discord.IncomingWebhook, error) {
	webhooks, err := restClient.GetWebhooks(channelID, rest.WithCtx(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to list webhooks: %w", err)
	}

	var webhook *discord.IncomingWebhook

	for _, w := range webhooks {
		if w.ID() == webhookID {
			if wh, ok := w.(discord.IncomingWebhook); ok {
				webhook = &wh
			}
			break
		}
	}

	return webhook, nil
}
