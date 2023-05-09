package magic

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	openai "github.com/sashabaranov/go-openai"
	"github.com/spf13/viper"
)

// TODO: investigate https://github.com/1rgs/jsonformer

type MagicHandler struct {
	pg *postgres.PostgresStore
}

func New(pg *postgres.PostgresStore) *MagicHandler {
	return &MagicHandler{pg}
}

func (h *MagicHandler) HandleGenerateMagicMessage(c *fiber.Ctx, req wire.GenerateMagicMessageRequestWire) error {
	session := c.Locals("session").(*session.Session)

	user, err := h.pg.Q.GetUser(c.Context(), session.UserID)
	if err != nil {
		return err
	}

	if !user.IsTester {
		return helpers.Forbidden("not_tester", "This feature is only available to testers!")
	}

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: "Only output minified JSON for a Discord webhook message.",
		},
		{
			Role:    openai.ChatMessageRoleUser,
			Content: req.Prompt,
		},
	}

	if req.BaseData.Valid {
		messages = append([]openai.ChatCompletionMessage{{
			Role:    openai.ChatMessageRoleAssistant,
			Content: req.BaseData.String,
		}}, messages...)
	}

	client := openai.NewClient(viper.GetString("openai.api_key"))
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			FrequencyPenalty: 0,
			PresencePenalty:  0,
			Temperature:      0.8,
			TopP:             1,
			MaxTokens:        3072,
			Model:            openai.GPT4,
			Messages:         messages,
		},
	)
	if err != nil {
		return err
	}

	output := resp.Choices[0].Message.Content

	// Sometimes ChatGPT still outputs text that isn't part of the JSON code, so lets just ignore it
	jsonStart := 0
	jsonEnd := len(output) - 1

	for i, c := range output {
		if c == '{' {
			jsonStart = i
			break
		}
	}

	for i := len(output) - 1; i >= 0; i-- {
		if output[i] == '}' {
			jsonEnd = i
			break
		}
	}

	return c.JSON(wire.GenerateMagicMessageResponseWire{
		Success: true,
		Data: wire.GenerateMagicMessageResponseDataWire{
			Data: output[jsonStart : jsonEnd+1],
		},
	})
}
