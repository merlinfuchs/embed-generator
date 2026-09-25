package webhook

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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

// fakeRest serves one text channel and its webhooks. sendErrs, sendChannels and editErrs are
// consumed one per request, so a test can make the next one fail or land somewhere else.
type fakeRest struct {
	rest.Rest

	webhooks     []discord.Webhook
	nextID       snowflake.ID
	listCalls    int
	createCalls  int
	deleted      []snowflake.ID
	sendErrs     []error
	sendChannels []snowflake.ID
	editErrs     []error
	// messageWebhook is the webhook GetMessage reports as the sender.
	messageWebhook snowflake.ID
	getMessages    int
	// sentFiles is what each send read from its attachments, which disgo does before every request.
	sentFiles []string
}

func pop[T any](queue *[]T) (T, bool) {
	var zero T
	if len(*queue) == 0 {
		return zero, false
	}
	v := (*queue)[0]
	*queue = (*queue)[1:]
	return v, true
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

func (f *fakeRest) CreateWebhookMessage(webhookID snowflake.ID, _ string, params discord.WebhookMessageCreate, _ rest.CreateWebhookMessageParams, _ ...rest.RequestOpt) (*discord.Message, error) {
	for _, file := range params.Files {
		data, _ := io.ReadAll(file.Reader)
		f.sentFiles = append(f.sentFiles, string(data))
	}

	if err, ok := pop(&f.sendErrs); ok && err != nil {
		return nil, err
	}

	landed := channelID
	if c, ok := pop(&f.sendChannels); ok {
		landed = c
	}
	f.nextID++
	return &discord.Message{ID: 1000 + f.nextID, ChannelID: landed, WebhookID: &webhookID}, nil
}

func (f *fakeRest) DeleteWebhookMessage(_ snowflake.ID, _ string, messageID snowflake.ID, _ snowflake.ID, _ ...rest.RequestOpt) error {
	f.deleted = append(f.deleted, messageID)
	return nil
}

func (f *fakeRest) GetMessage(channelID snowflake.ID, messageID snowflake.ID, _ ...rest.RequestOpt) (*discord.Message, error) {
	f.getMessages++
	return &discord.Message{ID: messageID, ChannelID: channelID, WebhookID: &f.messageWebhook}, nil
}

func (f *fakeRest) UpdateWebhookMessage(_ snowflake.ID, _ string, messageID snowflake.ID, _ discord.WebhookMessageUpdate, _ rest.UpdateWebhookMessageParams, _ ...rest.RequestOpt) (*discord.Message, error) {
	if err, ok := pop(&f.editErrs); ok && err != nil {
		return nil, err
	}
	return &discord.Message{ID: messageID, ChannelID: channelID}, nil
}

func restError(status int, code rest.JSONErrorCode) error {
	return &rest.Error{Response: &http.Response{StatusCode: status}, Code: code}
}

func notFound() error {
	return restError(http.StatusNotFound, rest.JSONErrorCodeUnknownWebhook)
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

func TestSendReplacesWebhookMovedToForum(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	send(t, m)
	f.webhooks = nil
	f.sendErrs = []error{restError(http.StatusBadRequest, rest.JSONErrorCodeWebhooksPostedToForumChannelsMustHaveThreadNameOrID)}
	send(t, m)

	if f.createCalls != 2 {
		t.Fatalf("want a new webhook for the channel, got %d creates", f.createCalls)
	}
}

func TestSendDoesNotRetryOtherErrors(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	send(t, m)
	f.sendErrs = []error{restError(http.StatusBadRequest, rest.JSONErrorCodeInvalidFormBody)}
	if _, err := m.SendMessageToChannel(context.Background(), channelID, discord.WebhookMessageCreate{}); err == nil {
		t.Fatal("want the error returned")
	}

	if f.listCalls != 1 {
		t.Fatalf("want the cached webhook kept, got %d lists", f.listCalls)
	}
}

func TestSendResendsAttachmentsOnRetry(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	send(t, m)
	f.sendErrs = []error{notFound()}
	params := discord.WebhookMessageCreate{Files: []*discord.File{
		{Name: "a.txt", Reader: bytes.NewReader([]byte("data"))},
		{Name: "b.txt", Reader: io.NopCloser(bytes.NewReader([]byte("more")))},
	}}
	if _, err := m.SendMessageToChannel(context.Background(), channelID, params); err != nil {
		t.Fatalf("send: %v", err)
	}

	want := []string{"data", "more", "data", "more"}
	if len(f.sentFiles) != len(want) {
		t.Fatalf("want %v, got %v", want, f.sentFiles)
	}
	for i := range want {
		if f.sentFiles[i] != want[i] {
			t.Fatalf("want %v, got %v", want, f.sentFiles)
		}
	}
}

func TestEditDropsDeletedWebhook(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	msg := send(t, m)
	webhookID := f.webhooks[0].ID()
	f.messageWebhook = webhookID
	if _, err := m.UpdateMessageInChannel(context.Background(), channelID, msg.ID, discord.WebhookMessageUpdate{}); err != nil {
		t.Fatalf("edit: %v", err)
	}

	f.editErrs = []error{notFound()}
	f.webhooks = nil
	if _, err := m.UpdateMessageInChannel(context.Background(), channelID, msg.ID, discord.WebhookMessageUpdate{}); err == nil {
		t.Fatal("want an error for the deleted webhook")
	}
	if m.webhooks.Get(editWebhookKey(channelID, webhookID)) != nil {
		t.Fatal("want the deleted webhook dropped from the cache")
	}
}

func TestNotEditableIsAUserError(t *testing.T) {
	err := fmt.Errorf("Failed to edit: %w", notEditable("No webhook"))

	var userErr *common.UserError
	if !errors.As(err, &userErr) || userErr.Message != "No webhook" {
		t.Fatalf("want the user error for the API, got %v", err)
	}
	if !errors.Is(err, ErrMessageNotEditable) {
		t.Fatal("want ErrMessageNotEditable for callers that stop retrying")
	}
}

func TestEditAsKnownSenderDoesNotFetchTheMessage(t *testing.T) {
	f := &fakeRest{}
	m := newTestManager(f)

	msg := send(t, m)
	f.messageWebhook = f.webhooks[0].ID()

	sender, err := m.MessageSender(context.Background(), channelID, msg.ID)
	if err != nil || !sender.Valid || sender.ID != f.messageWebhook {
		t.Fatalf("want the webhook that sent it, got %v, %v", sender, err)
	}

	f.getMessages = 0
	if _, err := m.UpdateMessageAsSender(context.Background(), channelID, msg.ID, sender, discord.WebhookMessageUpdate{}); err != nil {
		t.Fatalf("edit: %v", err)
	}
	if f.getMessages != 0 {
		t.Fatalf("want no message fetch, got %d", f.getMessages)
	}
}
