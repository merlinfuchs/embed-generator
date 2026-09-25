package handler

import (
	"fmt"
	"sync"
	"time"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
)

// autoDeferAfter leaves a second of Discord's three for the defer itself to arrive.
const autoDeferAfter = 2 * time.Second

type Interaction interface {
	Interaction() discord.Interaction
	HasResponded() bool
	Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message
}

// InitialResponder sends the initial response. For interactions received over HTTP it is the
// response to Discord's request, which is why it can't be sent through REST like the rest.
type InitialResponder func(discord.InteractionResponse) error

type restInteraction struct {
	inner   discord.Interaction
	rest    rest.Rest
	initial InitialResponder

	mu sync.Mutex
	// acknowledged is set once an initial response went out, the handler's or the automatic defer.
	acknowledged bool
	// responded is set once the handler responded, which the automatic defer doesn't count as.
	responded bool
}

// NewInteraction defers the interaction when the handler hasn't responded within autoDeferAfter,
// so slow actions don't run into Discord's three second limit. The handler's responses after
// that go out as followups and edits of the original response.
func NewInteraction(inner discord.Interaction, rest rest.Rest, initial InitialResponder) Interaction {
	i := &restInteraction{inner: inner, rest: rest, initial: initial}
	time.AfterFunc(autoDeferAfter, i.autoDefer)
	return i
}

func (i *restInteraction) Interaction() discord.Interaction {
	return i.inner
}

func (i *restInteraction) HasResponded() bool {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.responded
}

func (i *restInteraction) autoDefer() {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.acknowledged {
		return
	}

	resp := discord.InteractionResponse{Type: discord.InteractionResponseTypeDeferredUpdateMessage}
	if i.inner.Type() != discord.InteractionTypeComponent {
		// Whether the response will be public isn't known yet, and a private one must not end up
		// public, so the placeholder it replaces is ephemeral.
		resp = discord.InteractionResponse{
			Type: discord.InteractionResponseTypeDeferredCreateMessage,
			Data: discord.MessageCreate{Flags: discord.MessageFlagEphemeral},
		}
	}

	if err := i.initial(resp); err != nil {
		slog.Error("Failed to defer interaction", slog.Any("error", err))
		return
	}
	i.acknowledged = true
}

func (i *restInteraction) Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message {
	i.mu.Lock()
	defer i.mu.Unlock()

	responseType := discord.InteractionResponseTypeCreateMessage
	if len(t) > 0 {
		responseType = t[0]
	}

	var err error
	var msg *discord.Message

	switch {
	case !i.acknowledged:
		err = i.initial(discord.InteractionResponse{Type: responseType, Data: data})
		if err == nil {
			i.acknowledged = true
		}
	case !i.responded && isDeferred(responseType):
		// The automatic defer already did this.
	case responseType == discord.InteractionResponseTypeCreateMessage:
		msgData, ok := data.(discord.MessageCreate)
		if !ok {
			err = fmt.Errorf("can't create followup message, data is not a MessageCreate")
		} else {
			msg, err = i.rest.CreateFollowupMessage(i.inner.ApplicationID(), i.inner.Token(), msgData)
		}
	case responseType == discord.InteractionResponseTypeUpdateMessage:
		msgData, ok := data.(discord.MessageUpdate)
		if !ok {
			err = fmt.Errorf("can't update followup message, data is not a MessageUpdate")
		} else {
			msg, err = i.rest.UpdateInteractionResponse(i.inner.ApplicationID(), i.inner.Token(), msgData)
		}
	default:
		err = fmt.Errorf("invalid response type after initial response, %d", responseType)
	}

	if err != nil {
		slog.Error("Failed to respond to interaction", slog.Any("error", err))
	} else {
		i.responded = true
	}

	return msg
}

func isDeferred(t discord.InteractionResponseType) bool {
	return t == discord.InteractionResponseTypeDeferredCreateMessage || t == discord.InteractionResponseTypeDeferredUpdateMessage
}
