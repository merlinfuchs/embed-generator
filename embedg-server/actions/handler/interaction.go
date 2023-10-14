package handler

import (
	"github.com/merlinfuchs/discordgo"
	"github.com/rs/zerolog/log"
)

type Interaction interface {
	Interaction() *discordgo.Interaction
	HasResponded() bool
	Respond(data *discordgo.InteractionResponseData, t ...discordgo.InteractionResponseType) *discordgo.Message
}

type GatewayInteraction struct {
	Responded bool
	Session   *discordgo.Session
	Inner     *discordgo.Interaction
}

func (i *GatewayInteraction) Interaction() *discordgo.Interaction {
	return i.Inner
}

func (i *GatewayInteraction) HasResponded() bool {
	return i.Responded
}

func (i *GatewayInteraction) Respond(data *discordgo.InteractionResponseData, t ...discordgo.InteractionResponseType) *discordgo.Message {
	var err error

	responseType := discordgo.InteractionResponseChannelMessageWithSource
	if len(t) > 0 {
		responseType = t[0]
	}

	if !i.Responded {
		err = i.Session.InteractionRespond(i.Inner, &discordgo.InteractionResponse{
			Type: responseType,
			Data: data,
		})
	} else {
		var msg *discordgo.Message
		msg, err = i.Session.FollowupMessageCreate(i.Inner, true, &discordgo.WebhookParams{
			Content:    data.Content,
			Embeds:     data.Embeds,
			Components: data.Components,
			Files:      data.Files,
			Flags:      data.Flags,
		})
		return msg
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to respond to interaction")
	} else {
		i.Responded = true
	}

	return nil
}

type RestInteraction struct {
	Responded       bool
	InitialResponse chan *discordgo.InteractionResponse
	Session         *discordgo.Session
	Inner           *discordgo.Interaction
}

func (i *RestInteraction) Interaction() *discordgo.Interaction {
	return i.Inner
}

func (i *RestInteraction) HasResponded() bool {
	return i.Responded
}

func (i *RestInteraction) Respond(data *discordgo.InteractionResponseData, t ...discordgo.InteractionResponseType) *discordgo.Message {
	var err error

	responseType := discordgo.InteractionResponseChannelMessageWithSource
	if len(t) > 0 {
		responseType = t[0]
	}

	if !i.Responded {
		i.InitialResponse <- &discordgo.InteractionResponse{
			Type: responseType,
			Data: data,
		}
	} else {
		var msg *discordgo.Message
		_, err = i.Session.FollowupMessageCreate(i.Inner, true, &discordgo.WebhookParams{
			Content:    data.Content,
			Embeds:     data.Embeds,
			Components: data.Components,
			Files:      data.Files,
			Flags:      data.Flags,
		})
		return msg
	}

	if err != nil {
		log.Error().Err(err).Msg("Failed to respond to interaction")
	} else {
		i.Responded = true
	}

	return nil
}
