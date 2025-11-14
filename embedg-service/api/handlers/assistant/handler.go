package assistant

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
	openai "github.com/sashabaranov/go-openai"
)

// TODO: investigate https://github.com/1rgs/jsonformer

type AssistantHandler struct {
	am           *access.AccessManager
	planStore    store.PlanStore
	openaiAPIKey string
}

func New(
	am *access.AccessManager,
	planStore store.PlanStore,
	openaiAPIKey string,
) *AssistantHandler {
	return &AssistantHandler{
		am:           am,
		planStore:    planStore,
		openaiAPIKey: openaiAPIKey,
	}
}

func (h *AssistantHandler) HandleAssistantGenerateMessage(c *fiber.Ctx, req wire.AssistantGenerateMessageRequestWire) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return err
	}

	if !features.AIAssistant {
		return handlers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
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

	client := openai.NewClient(h.openaiAPIKey)
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
