package webhook

import (
	"context"
	"encoding/json"
	"net/http"
	"testing"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/manager/custom_bot"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

const (
	guildID      snowflake.ID = 1
	channelID    snowflake.ID = 2
	otherChannel snowflake.ID = 3
	appID        snowflake.ID = 4
)

type noCustomBots struct{ store.CustomBotStore }

func (noCustomBots) GetCustomBotByGuildID(context.Context, snowflake.ID) (*model.CustomBot, error) {
	return nil, store.ErrNotFound
}

// fakeRest serves one text channel and its webhooks. sendErrs and sendChannels are consumed one per
// send, so a test can make the next send fail or land somewhere else.
type fakeRest struct {
	rest.Rest

	webhooks     []discord.Webhook
	nextID       snowflake.ID
	listCalls    int
	createCalls  int
	deleted      []snowflake.ID
	sendErrs     []error
	sendChannels []snowflake.ID
}

func (f *fakeRest) GetChannel(id snowflake.ID, _ ...rest.RequestOpt) (discord.Channel, error) {
	var channel discord.GuildTextChannel
	raw, _ := json.Marshal(map[string]any{"id": id.String(), "guild_id": guildID.String(), "type": discord.ChannelTypeGuildText})
	if err := json.Unmarshal(raw, &channel); err != nil {
		return nil, err
	}
	return channel, nil
}

func (f *fakeRest) GetWebhooks(snowflake.ID, ...rest.RequestOpt) ([]discord.Webhook, error) {
	f.listCalls++
	return f.webhooks, nil
}

func (f *fakeRest) CreateWebhook(channelID snowflake.ID, _ discord.WebhookCreate, _ ...rest.RequestOpt) (*discord.IncomingWebhook, error) {
	f.createCalls++
	f.nextID++
	var webhook discord.IncomingWebhook
	raw, _ := json.Marshal(map[string]any{
		"id": (100 + f.nextID).String(), "type": discord.WebhookTypeIncoming, "channel_id": channelID.String(),
		"token": "token", "application_id": appID.String(),
	})
	if err := json.Unmarshal(raw, &webhook); err != nil {
		return nil, err
	}
	f.webhooks = []discord.Webhook{webhook}
	return &webhook, nil
}

func (f *fakeRest) CreateWebhookMessage(webhookID snowflake.ID, _ string, _ discord.WebhookMessageCreate, _ rest.CreateWebhookMessageParams, _ ...rest.RequestOpt) (*discord.Message, error) {
	if len(f.sendErrs) > 0 {
		err := f.sendErrs[0]
		f.sendErrs = f.sendErrs[1:]
		if err != nil {
			return nil, err
		}
	}

	landed := channelID
	if len(f.sendChannels) > 0 {
		landed = f.sendChannels[0]
		f.sendChannels = f.sendChannels[1:]
	}
	f.nextID++
	return &discord.Message{ID: 1000 + f.nextID, ChannelID: landed, WebhookID: &webhookID}, nil
}

func (f *fakeRest) DeleteWebhookMessage(_ snowflake.ID, _ string, messageID snowflake.ID, _ snowflake.ID, _ ...rest.RequestOpt) error {
	f.deleted = append(f.deleted, messageID)
	return nil
}

func notFound() error {
	return &rest.Error{Response: &http.Response{StatusCode: http.StatusNotFound}, Code: rest.JSONErrorCodeUnknownWebhook}
}

func newTestManager(f *fakeRest) *WebhookManager {
	return NewWebhookManager(f, guildstate.New(f), custom_bot.NewCustomBotManager(noCustomBots{}, f, common.Shards{}))
}

func send(t *testing.T, m *WebhookManager) *discord.Message {
	t.Helper()
	msg, err := m.SendMessageToChannel(context.Background(), channelID, discord.WebhookMessageCreate{Content: "hi"})
	if err != nil {
		t.Fatalf("send: %v", err)
	}
	return msg
}

func TestSendReusesWebhook(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	send(t, m)
	send(t, m)

	if f.listCalls != 1 || f.createCalls != 1 {
		t.Fatalf("want 1 list and 1 create, got %d and %d", f.listCalls, f.createCalls)
	}
}

func TestSendReplacesDeletedWebhook(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	send(t, m)
	f.webhooks = nil
	f.sendErrs = []error{notFound()}
	send(t, m)

	if f.listCalls != 2 || f.createCalls != 2 {
		t.Fatalf("want 2 lists and 2 creates, got %d and %d", f.listCalls, f.createCalls)
	}
}

func TestSendDoesNotRetryUncachedWebhook(t *testing.T) {
	f := &fakeRest{sendErrs: []error{notFound()}}
	m := newTestManager(f)

	if _, err := m.SendMessageToChannel(context.Background(), channelID, discord.WebhookMessageCreate{}); err == nil {
		t.Fatal("want the error of a freshly fetched webhook to be returned")
	}
	if f.listCalls != 1 {
		t.Fatalf("want 1 list, got %d", f.listCalls)
	}
}

func TestSendDeletesMessageOfMovedWebhook(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	send(t, m)
	f.webhooks = nil
	f.sendChannels = []snowflake.ID{otherChannel}
	msg := send(t, m)

	if msg.ChannelID != channelID {
		t.Fatalf("want the retry to land in %d, got %d", channelID, msg.ChannelID)
	}
	if len(f.deleted) != 1 {
		t.Fatalf("want the misplaced message deleted, got %v", f.deleted)
	}
	if f.createCalls != 2 {
		t.Fatalf("want a new webhook for the channel, got %d creates", f.createCalls)
	}
}
