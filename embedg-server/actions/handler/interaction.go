package handler

import (
	"fmt"
	"sync"
	"time"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
)

const (
	// autoDeferAfter leaves a second of Discord's three, which count from when the interaction was
	// created, for the defer itself to arrive.
	autoDeferAfter = 2 * time.Second
	// minAutoDeferAfter keeps a server clock ahead of Discord's from deferring fast responses too.
	minAutoDeferAfter = time.Second
)

type Interaction interface {
	Interaction() discord.Interaction
	HasResponded() bool
	Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message
	// Done stops the automatic defer, which a handler that returned without responding doesn't
	// want: a command would show "thinking" until the token expires.
	Done()
}

type actionInteraction struct {
	inner discord.Interaction
	rest  rest.Rest
	timer *time.Timer
	// initial sends the initial response. For interactions received over HTTP it is the response
	// to Discord's request, which is why it can't go through REST like the rest.
	initial events.InteractionResponderFunc

	mu sync.Mutex
	// acknowledged is set once an initial response went out, the handler's or the automatic defer.
	acknowledged bool
	// responded is set once the handler responded, which the automatic defer doesn't count as.
	responded bool
}

// NewInteraction defers the interaction when the handler hasn't responded within autoDeferAfter,
// so slow actions don't run into Discord's three second limit. The handler's responses after
// that go out as followups and edits of the original response.
func NewInteraction(inner discord.Interaction, restClient rest.Rest, initial events.InteractionResponderFunc) Interaction {
	i := &actionInteraction{inner: inner, rest: restClient, initial: initial}
	i.timer = time.AfterFunc(autoDeferDelay(time.Since(inner.CreatedAt())), i.autoDefer)
	return i
}

// autoDeferDelay counts from the interaction's creation, but only within bounds that a server
// clock off from Discord's can't push it out of.
func autoDeferDelay(sinceCreated time.Duration) time.Duration {
	return max(min(autoDeferAfter-sinceCreated, autoDeferAfter), minAutoDeferAfter)
}

func (i *actionInteraction) Done() {
	i.timer.Stop()
}

func (i *actionInteraction) Interaction() discord.Interaction {
	return i.inner
}

func (i *actionInteraction) HasResponded() bool {
	i.mu.Lock()
	defer i.mu.Unlock()
	return i.responded
}

func (i *actionInteraction) autoDefer() {
	i.mu.Lock()
	defer i.mu.Unlock()

	if i.acknowledged {
		return
	}

	var err error
	if i.inner.Type() == discord.InteractionTypeComponent {
		err = i.initial(discord.InteractionResponseTypeDeferredUpdateMessage, nil)
	} else {
		// Whether the response will be public isn't known yet, and a private one must not end up
		// public, so the placeholder it replaces is ephemeral.
		err = i.initial(discord.InteractionResponseTypeDeferredCreateMessage, discord.MessageCreate{Flags: discord.MessageFlagEphemeral})
	}
	if err != nil {
		slog.Error("Failed to defer interaction", slog.Any("error", err))
		return
	}
	i.acknowledged = true
}

func (i *actionInteraction) Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message {
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
		err = i.initial(responseType, data)
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
