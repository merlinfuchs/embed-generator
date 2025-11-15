package handler

import (
	"fmt"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/rest"
	"github.com/rs/zerolog/log"
)

type Interaction interface {
	Interaction() discord.Interaction
	HasResponded() bool
	Respond(data discord.InteractionResponseData, t ...discord.InteractionResponseType) *discord.Message
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
	} else {
		msgData, ok := data.(discord.MessageCreate)
		if !ok {
			err = fmt.Errorf("can't create followup message, data is not a MessageCreate")
		} else {
			msg, err = i.Rest.CreateFollowupMessage(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to respond to interaction")
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
	} else {
		msgData, ok := data.(discord.MessageCreate)
		if !ok {
			err = fmt.Errorf("can't create followup message, data is not a MessageCreate")
		} else {
			msg, err = i.Rest.CreateFollowupMessage(i.Inner.ApplicationID(), i.Inner.Token(), msgData)
		}
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to respond to interaction")
	} else {
		i.Responded = true
	}

	return msg
}

type InteractionDispatcher interface {
	DispatchInteraction(interaction Interaction) error
}
