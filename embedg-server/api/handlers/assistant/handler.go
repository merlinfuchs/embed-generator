package assistant

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	openai "github.com/sashabaranov/go-openai"
	"github.com/spf13/viper"
)

// TODO: investigate https://github.com/1rgs/jsonformer

type AssistantHandler struct {
	pg        *postgres.PostgresStore
	am        *access.AccessManager
	planStore store.PlanStore
}

func New(pg *postgres.PostgresStore, am *access.AccessManager, planStore store.PlanStore) *AssistantHandler {
	return &AssistantHandler{
		pg:        pg,
		am:        am,
		planStore: planStore,
	}
}

func (h *AssistantHandler) HandleAssistantGenerateMessage(c *fiber.Ctx, req wire.AssistantGenerateMessageRequestWire) error {
	guildID := c.Query("guild_id")

	if err := h.am.CheckUserGuildAccess(c, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !features.AIAssistant {
		return helpers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	messages := []openai.ChatCompletionMessage{
		{
			Role:    openai.ChatMessageRoleSystem,
			Content: "Output JSON code for a valid Discord webhook message. This can include a username, content, embeds, and components.",
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
			Temperature:      1.0,
			TopP:             1,
			MaxTokens:        3072,
			Model:            openai.GPT4o,
			Messages:         messages,
			ResponseFormat: &openai.ChatCompletionResponseFormat{
				Type: openai.ChatCompletionResponseFormatTypeJSONObject,
			},
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

	return c.JSON(wire.AssistantGenerateMessageResponseWire{
		Success: true,
		Data: wire.AssistantGenerateMessageResponseDataWire{
			Data: output[jsonStart : jsonEnd+1],
		},
	})
}
