package webhook

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	_ "embed"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

var ErrChannelNotFound = errors.New("channel not found")

// channel resolves a channel, reporting a channel the bot can no longer see as ErrChannelNotFound
// so callers can tell that apart from a failed request.
func (m *WebhookManager) channel(ctx context.Context, channelID common.ID) (discord.GuildChannel, error) {
	channel, err := m.guildState.Channel(ctx, channelID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil, ErrChannelNotFound
		}
		return nil, err
	}

	return channel, nil
}

// webhookChannel resolves the channel a webhook has to live on. Threads can't own webhooks, so
// messages to a thread go through the parent's webhook with a thread id.
func (m *WebhookManager) webhookChannel(ctx context.Context, channel discord.GuildChannel) (discord.GuildChannel, error) {
	if _, ok := channel.(discord.GuildThread); !ok {
		return channel, nil
	}

	parentID := channel.ParentID()
	if parentID == nil {
		return nil, fmt.Errorf("thread %s has no parent channel", channel.ID())
	}

	return m.channel(ctx, *parentID)
}

//go:embed logo-512.png
var logoFile []byte

func (m *WebhookManager) SendMessageToChannel(ctx context.Context, channelID common.ID, params discord.WebhookMessageCreate) (*discord.Message, error) {
	channel, err := m.channel(ctx, channelID)
	if err != nil {
		return nil, err
	}

	useCustomBot := false
	restClient, customBot, err := m.customBotManager.GetRestForGuild(ctx, channel.GuildID())
	if err != nil {
		slog.Error("failed to get custom bot for message username and avatar", slog.Any("error", err))
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
		newMessage, err = m.sendWithWebhook(ctx, channel, restClient, params)
		if err != nil {
			return nil, err
		}
	}

	return newMessage, nil
}

func (m *WebhookManager) UpdateMessageInChannel(ctx context.Context, channelID common.ID, messageID common.ID, params discord.WebhookMessageUpdate) (*discord.Message, error) {
	channel, err := m.channel(ctx, channelID)
	if err != nil {
		return nil, err
	}

	useCustomBot := false
	restClient, customBot, err := m.customBotManager.GetRestForGuild(ctx, channel.GuildID())
	if err != nil {
		slog.Error("failed to get custom bot for message username and avatar", slog.Any("error", err))
	}

	msg, err := restClient.GetMessage(channelID, messageID, rest.WithCtx(ctx))
	if err != nil {
		return nil, fmt.Errorf("Failed to get message from channel: %w", err)
	}

	if msg.WebhookID == nil {
		if customBot != nil && msg.Author.ID == customBot.UserID {
			useCustomBot = true
		} else {
			return nil, common.NewUserError("Message wasn't sent by a webhook and can therefore not be edited.")
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
		newMessage, err = m.updateWithWebhook(ctx, channel, restClient, *msg.WebhookID, messageID, params)
		if err != nil {
			return nil, err
		}
	}

	return newMessage, nil
}

// sendWithWebhook sends through the channel's webhook. A cached webhook can have been deleted or
// moved to another channel since, so either is detected and the send retried with a fresh one.
func (m *WebhookManager) sendWithWebhook(ctx context.Context, channel discord.GuildChannel, restClient rest.Rest, params discord.WebhookMessageCreate) (*discord.Message, error) {
	for attempt := 0; ; attempt++ {
		webhook, key, cached, err := m.findWebhookForChannel(ctx, channel)
		if err != nil {
			return nil, fmt.Errorf("Failed to find webhook: %w", err)
		}

		var threadID common.ID
		if webhook.ChannelID != channel.ID() {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channel.ID()
		}

		msg, err := restClient.CreateWebhookMessage(webhook.ID(), webhook.Token, params, rest.CreateWebhookMessageParams{
			Wait:           true,
			ThreadID:       threadID,
			WithComponents: true,
		}, rest.WithCtx(ctx))

		retry := cached && attempt == 0
		if err != nil {
			if retry && isStaleWebhookError(err) {
				m.webhooks.Delete(key)
				continue
			}
			return nil, fmt.Errorf("Failed to send message: %w", err)
		}

		// A forum post lands in the thread it creates, so only other sends can be checked. Sends to a
		// thread of the webhook's old channel fail instead and are covered above.
		if retry && params.ThreadName == "" && msg.ChannelID != channel.ID() {
			if err := restClient.DeleteWebhookMessage(webhook.ID(), webhook.Token, msg.ID, 0, rest.WithCtx(ctx)); err != nil {
				slog.Error("Failed to delete message sent through a moved webhook", slog.Any("error", err))
			}
			m.webhooks.Delete(key)
			continue
		}

		return msg, nil
	}
}

func (m *WebhookManager) updateWithWebhook(ctx context.Context, channel discord.GuildChannel, restClient rest.Rest, webhookID common.ID, messageID common.ID, params discord.WebhookMessageUpdate) (*discord.Message, error) {
	for attempt := 0; ; attempt++ {
		webhook, key, cached, err := m.getWebhookForChannel(ctx, channel, webhookID)
		if err != nil {
			return nil, fmt.Errorf("Failed to get the webhook that was used to create the message: %w", err)
		}

		var threadID common.ID
		if webhook.ChannelID != channel.ID() {
			// The webhook was requested for a thread, but belongs to the parent channel
			threadID = channel.ID()
		}

		msg, err := restClient.UpdateWebhookMessage(webhook.ID(), webhook.Token, messageID, params, rest.UpdateWebhookMessageParams{
			ThreadID:       threadID,
			WithComponents: true,
		}, rest.WithCtx(ctx))
		if err != nil {
			if cached && attempt == 0 && isStaleWebhookError(err) {
				m.webhooks.Delete(key)
				continue
			}
			return nil, fmt.Errorf("Failed to edit message: %w", err)
		}

		return msg, nil
	}
}

func isStaleWebhookError(err error) bool {
	return common.IsDiscordRestStatusCode(err, http.StatusUnauthorized, http.StatusForbidden, http.StatusNotFound)
}

// cachedWebhook reports whether the webhook came from the cache, as only then can a failure using it
// mean it went stale.
func (m *WebhookManager) cachedWebhook(key string, fetch func() (*discord.IncomingWebhook, error)) (*discord.IncomingWebhook, bool, error) {
	if item := m.webhooks.Get(key); item != nil {
		return item.Value(), true, nil
	}

	webhook, err := common.GetOrSet(&m.singleFlight, key, m.webhooks, fetch)
	return webhook, false, err
}

// findWebhookForChannel returns a webhook of the application that sends to the channel, creating one
// if there is none. The application matters beyond having a token: component interactions on the
// message go to the webhook's application.
func (m *WebhookManager) findWebhookForChannel(ctx context.Context, target discord.GuildChannel) (*discord.IncomingWebhook, string, bool, error) {
	channel, err := m.webhookChannel(ctx, target)
	if err != nil {
		return nil, "", false, err
	}

	restClient, customBot, err := m.customBotManager.GetRestForGuild(ctx, channel.GuildID())
	if err != nil {
		return nil, "", false, fmt.Errorf("Failed to get custom bot: %w", err)
	}

	appKey := "main"
	if customBot != nil {
		appKey = customBot.ApplicationID.String()
	}
	key := "send:" + channel.ID().String() + ":" + appKey

	webhook, cached, err := m.cachedWebhook(key, func() (*discord.IncomingWebhook, error) {
		return m.fetchOrCreateWebhook(ctx, channel, restClient, customBot)
	})
	return webhook, key, cached, err
}

func (m *WebhookManager) fetchOrCreateWebhook(ctx context.Context, channel discord.GuildChannel, restClient rest.Rest, customBot *model.CustomBot) (*discord.IncomingWebhook, error) {
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

func (m *WebhookManager) getWebhookForChannel(ctx context.Context, target discord.GuildChannel, webhookID common.ID) (*discord.IncomingWebhook, string, bool, error) {
	channel, err := m.webhookChannel(ctx, target)
	if err != nil {
		return nil, "", false, err
	}

	key := "edit:" + channel.ID().String() + ":" + webhookID.String()
	webhook, cached, err := m.cachedWebhook(key, func() (*discord.IncomingWebhook, error) {
		return m.fetchWebhook(ctx, channel, webhookID)
	})
	return webhook, key, cached, err
}

func (m *WebhookManager) fetchWebhook(ctx context.Context, channel discord.GuildChannel, webhookID common.ID) (*discord.IncomingWebhook, error) {
	// First try to get the webhook with the default rest client
	webhook, err := m.getWebhookForChannelWithRestClient(ctx, channel.ID(), webhookID, m.rest)
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
			webhook, err := m.getWebhookForChannelWithRestClient(ctx, channel.ID(), webhookID, restClient)
			if err != nil {
				return nil, fmt.Errorf("Failed to get webhook: %w", err)
			}

			if webhook != nil && webhook.Token != "" {
				return webhook, nil
			} else if webhook != nil {
				return nil, common.NewUserError("The webhook belongs to another application and can't be used by Embed Generator.")
			}
		}
	}

	return nil, common.NewUserError("No webhook found that matches the given ID.")
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
