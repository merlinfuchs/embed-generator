package command

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/disgoorg/disgo/bot"
	"github.com/disgoorg/disgo/cache"
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/handler"
	"github.com/disgoorg/disgo/handler/middleware"
	"github.com/disgoorg/disgo/rest"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions/parser"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/manager/webhook"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type CommandHandlerConfig struct {
	DiscordLink  string
	AppPublicURL string
}

type CommandHandler struct {
	config             CommandHandlerConfig
	caches             cache.Caches
	rest               rest.Rest
	appContext         store.AppContext
	sharedMessageStore store.SharedMessageStore
	actionParser       *parser.ActionParser
	webhookManager     *webhook.WebhookManager
	router             handler.Router
}

func NewCommandHandler(
	config CommandHandlerConfig,
	caches cache.Caches,
	rest rest.Rest,
	appContext store.AppContext,
	sharedMessageStore store.SharedMessageStore,
	actionParser *parser.ActionParser,
	webhookManager *webhook.WebhookManager,
) *CommandHandler {
	h := &CommandHandler{
		config:             config,
		caches:             caches,
		rest:               rest,
		appContext:         appContext,
		sharedMessageStore: sharedMessageStore,
		actionParser:       actionParser,
		webhookManager:     webhookManager,
	}
	h.router = h.interactionRouter()
	return h
}

func (g *CommandHandler) interactionRouter() handler.Router {
	mx := handler.New().
		With(middleware.GoErr(func(e *handler.InteractionEvent, err error) {
			slog.Error(
				"Error while handling interaction",
				slog.Int("interaction_type", int(e.Interaction.Type())),
				slog.String("interaction_id", e.Interaction.ID().String()),
				slog.Any("error", err),
			)

			errorMessage := discord.MessageCreate{
				Content: fmt.Sprintf(
					"An error occurred while handling this interaction. Please report this: ```%s```",
					err.Error(),
				),
				Flags: discord.MessageFlagEphemeral,
			}

			respErr := e.Respond(discord.InteractionResponseTypeCreateMessage, errorMessage)
			if errors.Is(respErr, discord.ErrInteractionAlreadyReplied) ||
				common.IsDiscordRestErrorCode(respErr, 40060) {
				_, _ = e.Client().Rest.CreateFollowupMessage(
					e.Interaction.ApplicationID(),
					e.Interaction.Token(),
					errorMessage,
				)
			}
		}))

	mx.Command("/invite", g.handleHelpCommand)
	mx.Command("/website", g.handleHelpCommand)
	mx.Command("/help", g.handleHelpCommand)

	mx.Route("/format", func(r handler.Router) {
		r.Command("/text", g.handleFormatTextCommand)
		r.Command("/user", g.handleFormatUserCommand)
		r.Command("/channel", g.handleFormatChannelCommand)
		r.Command("/role", g.handleFormatRoleCommand)
		r.Command("/emoji", g.handleFormatEmojiCommand)
	})

	mx.Route("/image", func(r handler.Router) {
		r.Command("/avatar", g.handleImageAvatarCommand)
		r.Command("/icon", g.handleImageIconCommand)
		r.Command("/emoji", g.handleImageEmojiCommand)
	})

	mx.Route("/message", func(r handler.Router) {
		r.Command("/restore", g.handleMessageRestoreCommand)
		r.Command("/dump", g.handleMessageDumpCommand)
	})

	mx.Command("/Restore Message", g.handleMessageRestoreContextCommand)
	mx.Command("/Dump Message", g.handleMessageDumpContextCommand)

	mx.Command("/Avatar Url", g.handleUserAvatarURLContextCommand)
	mx.Command("/Format Mention", g.handleFormatMentionContextCommand)

	mx.Route("/embed", func(r handler.Router) {
		r.Command("/", g.handleEmbedCommand)

		r.ButtonComponent("/title", g.handleEmbedTitleButton)
		r.ButtonComponent("/author", g.handleEmbedAuthorButton)
		r.ButtonComponent("/description", g.handleEmbedDescriptionButton)
		r.ButtonComponent("/color", g.handleEmbedColorButton)
		r.ButtonComponent("/image", g.handleEmbedImageButton)
		r.ButtonComponent("/thumbnail", g.handleEmbedThumbnailButton)
		r.ButtonComponent("/footer", g.handleEmbedFooterButton)

		r.ButtonComponent("/submit", g.handleEmbedSubmitButton)

		r.Modal("/update", g.handleEmbedUpdateModal)
		r.Modal("/send", g.handleEmbedSendModal)
	})
	return mx
}

func (g *CommandHandler) OnEvent(event bot.Event) {
	g.router.OnEvent(event)
}
