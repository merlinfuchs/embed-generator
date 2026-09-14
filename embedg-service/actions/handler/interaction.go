package handler

import (
	"fmt"

	"log/slog"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/events"
	"github.com/disgoorg/disgo/rest"
)

type Interaction interface {
	Interaction() discord.Interaction
	HasResponded() bool
	Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message
}

type GenericInteraction struct {
	Responded   bool
	Rest        rest.Rest
	Inner       discord.Interaction
	RespondFunc events.InteractionResponderFunc
}

func (i *GenericInteraction) Interaction() discord.Interaction {
	return i.Inner
}

func (i *GenericInteraction) HasResponded() bool {
	return i.Responded
}

func (i *GenericInteraction) Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message {
	responseType := discord.InteractionResponseTypeCreateMessage
	if len(t) > 0 {
		responseType = t[0]
	}

	var err error
	var msg *discord.Message

	if !i.Responded {
		err = i.RespondFunc(responseType, data)
	} else if responseType == discord.InteractionResponseTypeCreateMessage {
		msgData, ok := data.(discord.MessageCreate)
		if !ok {
			err = fmt.Errorf("can't create followup message, data is not a MessageCreate")
		} else {
			msg, err = i.Rest.CreateFollowupMessage(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	} else if responseType == discord.InteractionResponseTypeUpdateMessage {
		msgData, ok := data.(discord.MessageUpdate)
		if !ok {
			err = fmt.Errorf("can't update followup message, data is not a MessageUpdate")
		} else {
			msg, err = i.Rest.UpdateInteractionResponse(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	} else {
		err = fmt.Errorf("invalid response type after initial response, %d", responseType)
	}

	if err != nil {
		slog.Error("Failed to respond to interaction", slog.Any("error", err))
	} else {
		i.Responded = true
	}

	return msg
}

type GatewayInteraction struct {
	Responded bool
	Rest      rest.Rest
	Inner     discord.Interaction
}

func (i *GatewayInteraction) Interaction() discord.Interaction {
	return i.Inner
}

func (i *GatewayInteraction) HasResponded() bool {
	return i.Responded
}

func (i *GatewayInteraction) Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message {
	var err error

	responseType := discord.InteractionResponseTypeCreateMessage
	if len(t) > 0 {
		responseType = t[0]
	}

	var msg *discord.Message

	if !i.Responded {
		err = i.Rest.CreateInteractionResponse(
			i.Inner.ID(),
			i.Inner.Token(),
			discord.InteractionResponse{
				Type: responseType,
				Data: data,
			},
		)
	} else if responseType == discord.InteractionResponseTypeCreateMessage {
		msgData, ok := data.(discord.MessageCreate)
		if !ok {
			err = fmt.Errorf("can't create followup message, data is not a MessageCreate")
		} else {
			msg, err = i.Rest.CreateFollowupMessage(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	} else if responseType == discord.InteractionResponseTypeUpdateMessage {
		msgData, ok := data.(discord.MessageUpdate)
		if !ok {
			err = fmt.Errorf("can't update followup message, data is not a MessageUpdate")
		} else {
			msg, err = i.Rest.UpdateInteractionResponse(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	} else {
		err = fmt.Errorf("invalid response type after initial response, %d", responseType)
	}

	if err != nil {
		slog.Error("Failed to respond to interaction", slog.Any("error", err))
	} else {
		i.Responded = true
	}

	return msg
}

type RestInteraction struct {
	Responded       bool
	InitialResponse chan *discord.InteractionResponse
	Rest            rest.Rest
	Inner           discord.Interaction
}

func (i *RestInteraction) Interaction() discord.Interaction {
	return i.Inner
}

func (i *RestInteraction) HasResponded() bool {
	return i.Responded
}

func (i *RestInteraction) Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message {
	var err error

	responseType := discord.InteractionResponseTypeCreateMessage
	if len(t) > 0 {
		responseType = t[0]
	}

	var msg *discord.Message

	if !i.Responded {
		i.InitialResponse <- &discord.InteractionResponse{
			Type: responseType,
			Data: data,
		}
	} else if responseType == discord.InteractionResponseTypeCreateMessage {
		msgData, ok := data.(discord.MessageCreate)
		if !ok {
			err = fmt.Errorf("can't create followup message, data is not a MessageCreate")
		} else {
			msg, err = i.Rest.CreateFollowupMessage(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	} else if responseType == discord.InteractionResponseTypeUpdateMessage {
		msgData, ok := data.(discord.MessageUpdate)
		if !ok {
			err = fmt.Errorf("can't update followup message, data is not a MessageUpdate")
		} else {
			msg, err = i.Rest.UpdateInteractionResponse(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	} else {
		err = fmt.Errorf("invalid response type after initial response, %d", responseType)
	}

	if err != nil {
		slog.Error("Failed to respond to interaction", slog.Any("error", err))
	} else {
		i.Responded = true
	}

	return msg
}
