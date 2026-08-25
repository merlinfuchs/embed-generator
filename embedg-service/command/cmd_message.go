package command

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/handler"
	"github.com/disgoorg/disgo/rest"
	"github.com/disgoorg/snowflake/v2"
	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/merlinfuchs/embed-generator/embedg-service/actions"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
)

func (g *CommandHandler) handleMessageRestoreCommand(e *handler.CommandEvent) error {
	message, err := g.getMessageFromCommand(e)
	if err != nil {
		return err
	} else if message == nil {
		return nil
	}

	messageDump, err := g.dumpMessage(e.Ctx, message)
	if err != nil {
		return fmt.Errorf("failed to dump message: %w", err)
	}

	msg, err := g.sharedMessageStore.CreateSharedMessage(e.Ctx, model.SharedMessage{
		ID:        util.UniqueID(),
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(time.Hour * 24),
		Data:      messageDump,
	})
	if err != nil {
		return fmt.Errorf("failed to create shared message: %w", err)
	}

	url := fmt.Sprintf("%s/editor/share/%s", g.config.AppPublicURL, msg.ID)
	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("Click this link to restore the message: [message.style](<%s>)", url),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleMessageRestoreContextCommand(e *handler.CommandEvent) error {
	data := e.MessageCommandInteractionData()
	message := data.TargetMessage()

	messageDump, err := g.dumpMessage(e.Ctx, &message)
	if err != nil {
		return fmt.Errorf("failed to dump message: %w", err)
	}

	msg, err := g.sharedMessageStore.CreateSharedMessage(e.Ctx, model.SharedMessage{
		ID:        util.UniqueID(),
		CreatedAt: time.Now().UTC(),
		ExpiresAt: time.Now().UTC().Add(time.Hour * 24),
		Data:      messageDump,
	})
	if err != nil {
		return fmt.Errorf("failed to create shared message: %w", err)
	}

	url := fmt.Sprintf("%s/editor/share/%s", g.config.AppPublicURL, msg.ID)
	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("Click this link to restore the message: [message.style](<%s>)", url),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleMessageDumpCommand(e *handler.CommandEvent) error {
	message, err := g.getMessageFromCommand(e)
	if err != nil {
		return err
	} else if message == nil {
		return nil
	}

	messageDump, err := g.dumpMessage(e.Ctx, message)
	if err != nil {
		return fmt.Errorf("failed to dump message: %w", err)
	}

	paste, err := util.CreateVaultBinPaste(string(messageDump), "json")
	if err != nil {
		return fmt.Errorf("failed to create vaultb.in paste: %w", err)
	}

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("You can find the JSON code here: <%s>", paste.URL()),
		Flags:   discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleMessageDumpContextCommand(e *handler.CommandEvent) error {
	data := e.MessageCommandInteractionData()
	message := data.TargetMessage()

	messageDump, err := g.dumpMessage(e.Ctx, &message)
	if err != nil {
		return fmt.Errorf("failed to dump message: %w", err)
	}

	paste, err := util.CreateVaultBinPaste(string(messageDump), "json")
	if err != nil {
		return fmt.Errorf("failed to create vaultb.in paste: %w", err)
	}

	return e.CreateMessage(discord.MessageCreate{
		Content: fmt.Sprintf("You can find the JSON code here: <%s>", paste.URL()),
		Flags:   discord.MessageFlagEphemeral,
	})
}

var messageURLRegex = regexp.MustCompile(`https?://(?:canary\.|ptb\.)?discord\.com/channels/[0-9]+/([0-9]+)/([0-9]+)`)

func (g *CommandHandler) getMessageFromCommand(e *handler.CommandEvent) (*discord.Message, error) {
	messageIDOrURL := e.SlashCommandInteractionData().String("message_id_or_url")

	channelID := e.Channel().ID()
	var messageID common.ID

	match := messageURLRegex.FindStringSubmatch(messageIDOrURL)
	if match != nil {
		channelID, _ = snowflake.Parse(match[1])
		messageID, _ = snowflake.Parse(match[2])

		channel, ok := g.caches.Channel(channelID)
		if !ok {
			return nil, e.CreateMessage(discord.MessageCreate{
				Content: "The message belongs to a channel that the bot doesn't have access to.",
				Flags:   discord.MessageFlagEphemeral,
			})
		}

		if channel.GuildID() != *e.GuildID() {
			return nil, e.CreateMessage(discord.MessageCreate{
				Content: "The channel doesn't belong to this server.",
				Flags:   discord.MessageFlagEphemeral,
			})
		}
	} else {
		var err error
		messageID, err = snowflake.Parse(messageIDOrURL)
		if err != nil {
			return nil, fmt.Errorf("failed to parse message ID: %w", err)
		}
	}

	message, err := g.rest.GetMessage(channelID, messageID, rest.WithCtx(e.Ctx))
	if err != nil {
		if common.IsDiscordRestErrorCode(err, discordgo.ErrCodeUnknownMessage) {
			return nil, e.CreateMessage(discord.MessageCreate{
				Content: "Message not found.",
				Flags:   discord.MessageFlagEphemeral,
			})
		}

		return nil, fmt.Errorf("failed to get message: %w", err)
	}

	return message, nil
}

func (g *CommandHandler) dumpMessage(ctx context.Context, message *discord.Message) (json.RawMessage, error) {
	components, err := g.actionParser.UnparseMessageComponents(message.Components)
	if err != nil {
		return nil, fmt.Errorf("failed to unparse message components: %w", err)
	}

	actionSets, err := g.actionParser.RetrieveActionsForMessage(ctx, message.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve actions for message: %w", err)
	}

	return json.MarshalIndent(actions.MessageWithActions{
		Username:   message.Author.Username,
		AvatarURL:  message.Author.EffectiveAvatarURL(discord.WithSize(1024)),
		Content:    message.Content,
		Embeds:     message.Embeds,
		Components: components,
		Actions:    actionSets,
	}, "", "  ")
}
