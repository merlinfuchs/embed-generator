package handlers

import (
	"sync"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/gofiber/fiber/v2"
)

// InteractionResponder hands the initial response of an interaction received over HTTP to the
// request, which is how Discord wants it, and which has to answer within three seconds.
type InteractionResponder struct {
	// Buffered, and only ever written once: Respond holds the mutex across the send, and Wait
	// takes the same mutex when it stops waiting. A blocking send would deadlock the two.
	ch chan *discord.InteractionResponse

	mu        sync.Mutex
	responded bool
	expired   bool
}

func NewInteractionResponder() *InteractionResponder {
	return &InteractionResponder{ch: make(chan *discord.InteractionResponse, 1)}
}

// Respond is an events.InteractionResponderFunc.
func (r *InteractionResponder) Respond(responseType discord.InteractionResponseType, data discord.InteractionResponseData, _ ...rest.RequestOpt) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.responded {
		return discord.ErrInteractionAlreadyReplied
	}
	if r.expired {
		return discord.ErrInteractionExpired
	}

	r.ch <- &discord.InteractionResponse{Type: responseType, Data: data}
	r.responded = true
	return nil
}

// Wait answers the request with the initial response, or gives up after three seconds.
func (r *InteractionResponder) Wait(c *fiber.Ctx) error {
	status := fiber.StatusInternalServerError
	select {
	case resp := <-r.ch:
		r.expire()
		return c.JSON(resp)
	case <-c.Context().Done():
		status = fiber.StatusNoContent
	case <-time.After(3 * time.Second):
	}

	r.expire()
	// A response that came in while giving up was already reported as sent.
	select {
	case resp := <-r.ch:
		return c.JSON(resp)
	default:
		return c.SendStatus(status)
	}
}

func (r *InteractionResponder) expire() {
	r.mu.Lock()
	r.expired = true
	r.mu.Unlock()
}
