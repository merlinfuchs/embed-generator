package assistant

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"slices"
	"time"

	"github.com/disgoorg/disgo/discord"
	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	ai "github.com/merlinfuchs/embed-generator/embedg-server/assistant"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/guildstate"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

// Answers that don't change the message don't count as prompts, so the assistant can ask what's
// missing for free. They are limited to this many times the plan's prompts, so it can't be used as
// a free chatbot.
const answerLimitFactor = 3

// respondTimeout bounds a prompt, repairs included.
const respondTimeout = 90 * time.Second

const notSetUpMessage = "The AI assistant isn't set up on this server."

// maxSavedMessages is how many of the guild's saved messages the assistant is told about.
const maxSavedMessages = 100

type AssistantHandler struct {
	am                *access.AccessManager
	planStore         store.PlanStore
	promptStore       store.AssistantPromptStore
	savedMessageStore store.SavedMessageStore
	guildState        *guildstate.Provider
	// assistant is nil if no OpenAI API key is configured.
	assistant *ai.Assistant
}

func New(
	am *access.AccessManager,
	planStore store.PlanStore,
	promptStore store.AssistantPromptStore,
	savedMessageStore store.SavedMessageStore,
	guildState *guildstate.Provider,
	assistant *ai.Assistant,
) *AssistantHandler {
	return &AssistantHandler{
		am:                am,
		planStore:         planStore,
		promptStore:       promptStore,
		savedMessageStore: savedMessageStore,
		guildState:        guildState,
		assistant:         assistant,
	}
}

func (h *AssistantHandler) HandleGetUsage(c *fiber.Ctx) error {
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	count, err := h.promptCount(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	unavailable := limitMessage(features.MaxAIPromptsPerMonth, count)
	if h.assistant == nil {
		unavailable = notSetUpMessage
	}

	return c.JSON(wire.AssistantUsageResponseWire{
		Success: true,
		Data: wire.AssistantUsageWire{
			PromptsUsed:  count.Edited,
			PromptsLimit: features.MaxAIPromptsPerMonth,
			Unavailable:  unavailable,
		},
	})
}

func (h *AssistantHandler) HandleChat(c *fiber.Ctx, req wire.AssistantChatRequestWire) error {
	session := c.Locals("session").(*session.Session)
	guildID, err := handlers.QueryID(c, "guild_id")
	if err != nil {
		return err
	}

	if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
		return err
	}

	if h.assistant == nil {
		return handlers.ServiceUnavailable("assistant_unavailable", notSetUpMessage)
	}

	features, err := h.planStore.GetPlanFeaturesForGuild(c.UserContext(), guildID)
	if err != nil {
		return err
	}

	// Unlike other limits, 0 means none, so plans need to opt in.
	limit := features.MaxAIPromptsPerMonth
	if limit == 0 {
		return handlers.Forbidden("insufficient_plan", "This feature is not available on your plan!")
	}

	// Checked before loading the guild, so requests over the limit are cheap.
	count, err := h.promptCount(c.UserContext(), guildID)
	if err != nil {
		return err
	}
	if message := limitMessage(limit, count); message != "" {
		return handlers.BadRequest("resource_limit", message)
	}

	// Loaded before the prompt is recorded, so failing doesn't use it up.
	guild, err := h.guild(c.UserContext(), guildID, features)
	if err != nil {
		return err
	}

	// The prompt is recorded, and counted as edited, before the model is called. The limits are
	// then checked again with it, so requests sent at the same time can't all pass them.
	now := time.Now().UTC()
	prompt := model.AssistantPrompt{
		ID:        common.InternalID(),
		GuildID:   guildID,
		UserID:    session.UserID,
		Model:     h.assistant.Model(),
		Prompt:    req.Messages[len(req.Messages)-1].Content,
		Edited:    true,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := h.promptStore.CreateAssistantPrompt(c.UserContext(), prompt); err != nil {
		return fmt.Errorf("failed to create assistant prompt: %w", err)
	}
	count, err = h.promptCount(c.UserContext(), guildID)
	if err != nil {
		return err
	}
	// The counts include this prompt now.
	if message := limitMessage(limit, model.AssistantPromptCount{Edited: count.Edited - 1, Total: count.Total - 1}); message != "" {
		if err := h.promptStore.DeleteAssistantPrompt(c.UserContext(), guildID, prompt.ID); err != nil {
			slog.Error("Failed to delete assistant prompt", slog.String("guild_id", guildID.String()), slog.Any("error", err))
		}
		return handlers.BadRequest("resource_limit", message)
	}
	used := count.Edited

	messages := make([]ai.Message, len(req.Messages))
	for i, m := range req.Messages {
		messages[i] = ai.Message{Role: m.Role, Content: m.Content}
	}

	// Bounded, so a slow model or repairs can't outlast proxies in front of the API.
	ctx, cancel := context.WithTimeout(c.UserContext(), respondTimeout)
	defer cancel()
	res, err := h.assistant.Respond(ctx, ai.Request{
		Message:  req.Message,
		Messages: messages,
		Guild:    guild,
		GuildID:  guildID,
		UserID:   session.UserID,
	})
	if res == nil {
		// Prompts the model didn't answer at all don't count.
		if err := h.promptStore.DeleteAssistantPrompt(c.UserContext(), guildID, prompt.ID); err != nil {
			slog.Error("Failed to delete assistant prompt", slog.String("guild_id", guildID.String()), slog.Any("error", err))
		}
	} else {
		// Answers that don't change the message don't count. Ones that can't be used do, as they
		// cost as much.
		prompt.Edited = err != nil || res.MessageJSON != "" || res.Repairs > 0
		prompt.Rounds = 1 + res.Repairs
		prompt.Usage = res.Usage
		prompt.UpdatedAt = time.Now().UTC()
		// Failing to record the usage shouldn't lose the answer.
		if err := h.promptStore.FinishAssistantPrompt(c.UserContext(), prompt); err != nil {
			slog.Error("Failed to finish assistant prompt", slog.String("guild_id", guildID.String()), slog.Any("error", err))
		}
	}
	if err != nil {
		var resErr *ai.ErrResponse
		if errors.As(err, &resErr) {
			return handlers.ServiceUnavailable("assistant_failed", resErr.Message)
		}
		slog.Error("Failed to get assistant response", slog.String("guild_id", guildID.String()), slog.Any("error", err))
		return handlers.ServiceUnavailable("assistant_unavailable", "The AI assistant isn't available right now. Please try again later.")
	}

	if !prompt.Edited {
		used--
	}

	fields := make([]wire.AssistantFieldWire, len(res.Fields))
	for i, f := range res.Fields {
		fields[i] = wire.AssistantFieldWire(f)
	}

	return c.JSON(wire.AssistantChatResponseWire{
		Success: true,
		Data: wire.AssistantChatResponseDataWire{
			Message:     res.Message,
			Data:        res.MessageJSON,
			BuildPrompt: res.BuildPrompt,
			Fields:      fields,
			Issues:      res.Issues,
			Repairs:     res.Repairs,
			Usage: wire.AssistantUsageWire{
				PromptsUsed:  used,
				PromptsLimit: limit,
				Unavailable:  limitMessage(limit, model.AssistantPromptCount{Edited: used, Total: count.Total}),
			},
		},
	})
}

// limitMessage says why the guild can't send another prompt this month, or is empty if it can.
func limitMessage(limit int, count model.AssistantPromptCount) string {
	if limit == 0 {
		return "Your plan doesn't include the AI assistant."
	}
	if count.Edited >= limit {
		return fmt.Sprintf("You've used all %d AI prompts for this month.", limit)
	}
	if count.Total >= answerLimitFactor*limit {
		return "You've asked the AI too many questions this month."
	}
	return ""
}

func (h *AssistantHandler) promptCount(ctx context.Context, guildID common.ID) (model.AssistantPromptCount, error) {
	now := time.Now().UTC()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	count, err := h.promptStore.CountAssistantPromptsSince(ctx, guildID, start)
	if err != nil {
		return count, fmt.Errorf("failed to count assistant prompts: %w", err)
	}
	return count, nil
}

// guild collects what the assistant needs to know about the guild. Channels are left out, as the
// user may not be allowed to see all of them, and the assistant asks for them instead.
func (h *AssistantHandler) guild(ctx context.Context, guildID common.ID, features model.PlanFeatures) (ai.Guild, error) {
	guild := ai.Guild{Features: features}

	state, err := h.guildState.Guild(ctx, guildID)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		return guild, fmt.Errorf("failed to get guild state: %w", err)
	}
	if state != nil {
		guild.Name = state.Guild.Name
		guild.HasBot = true

		// Highest first, like Discord lists them.
		roles := slices.SortedFunc(slices.Values(state.Roles), func(a, b discord.Role) int {
			return b.Position - a.Position
		})
		for _, role := range roles {
			// Everyone has @everyone, which has the guild's ID.
			if role.ID == guildID {
				continue
			}
			guild.Roles = append(guild.Roles, ai.Role{ID: role.ID, Name: role.Name, Managed: role.Managed})
		}

		for _, emoji := range state.Emojis {
			if !emoji.Available {
				continue
			}
			guild.Emojis = append(guild.Emojis, ai.Emoji{ID: emoji.ID, Name: emoji.Name, Animated: emoji.Animated})
		}
	}

	saved, err := h.savedMessageStore.GetSavedMessageNamesForGuild(ctx, guildID, maxSavedMessages)
	if err != nil {
		return guild, fmt.Errorf("failed to get saved messages: %w", err)
	}
	for _, m := range saved {
		guild.SavedMessages = append(guild.SavedMessages, ai.SavedMessage{ID: m.ID, Name: m.Name})
	}

	return guild, nil
}
