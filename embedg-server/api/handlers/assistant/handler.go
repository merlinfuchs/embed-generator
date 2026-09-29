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

// repairWindow is how long after a prompt its message can be repaired.
const repairWindow = time.Hour

// Answers that don't change the message don't count as prompts, so the assistant can ask what's
// missing for free. They are limited to this many times the plan's prompts, so it can't be used as
// a free chatbot.
const answerLimitFactor = 3

// maxSavedMessages is how many of the guild's saved messages the assistant is told about.
const maxSavedMessages = 100

type AssistantHandler struct {
	am                *access.AccessManager
	planStore         store.PlanStore
	promptStore       store.AssistantPromptStore
	savedMessageStore store.SavedMessageStore
	guildState        *guildstate.Provider
	// assistant is nil if no OpenAI API key is configured.
	assistant  *ai.Assistant
	maxRepairs int
}

func New(
	am *access.AccessManager,
	planStore store.PlanStore,
	promptStore store.AssistantPromptStore,
	savedMessageStore store.SavedMessageStore,
	guildState *guildstate.Provider,
	assistant *ai.Assistant,
	maxRepairs int,
) *AssistantHandler {
	return &AssistantHandler{
		am:                am,
		planStore:         planStore,
		promptStore:       promptStore,
		savedMessageStore: savedMessageStore,
		guildState:        guildState,
		assistant:         assistant,
		maxRepairs:        maxRepairs,
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

	return c.JSON(wire.AssistantUsageResponseWire{
		Success: true,
		Data: wire.AssistantUsageWire{
			PromptsUsed:  count.Edited,
			PromptsLimit: features.MaxAIPromptsPerMonth,
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
		return handlers.ServiceUnavailable("assistant_unavailable", "The AI assistant isn't set up on this server.")
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

	count, err := h.promptCount(c.UserContext(), guildID)
	if err != nil {
		return err
	}
	used := count.Edited

	isRepair := req.RepairPromptID != ""
	if !isRepair {
		if err := checkLimits(limit, count); err != nil {
			return err
		}
	}

	// Loaded before the prompt is recorded, so failing doesn't use it up.
	guild, err := h.guild(c.UserContext(), guildID, features)
	if err != nil {
		return err
	}

	// The prompt is recorded, and counted as edited, before the model is called, so requests sent
	// while it runs count it. Requests sent at the same moment can still all pass the limits.
	now := time.Now().UTC()
	var prompt *model.AssistantPrompt
	if isRepair {
		prompt, err = h.promptStore.GetAssistantPrompt(c.UserContext(), guildID, req.RepairPromptID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return handlers.NotFound("unknown_prompt", "Prompt not found")
			}
			return fmt.Errorf("failed to get assistant prompt: %w", err)
		}
		// Prompts whose answer didn't change the message don't count, so their repairs can't be
		// used to get changes for free.
		if !prompt.Edited {
			return handlers.BadRequest("nothing_to_repair", "The prompt made no changes to repair.")
		}
		if now.Sub(prompt.CreatedAt) > repairWindow {
			return handlers.BadRequest("repair_expired", "The prompt is too old to be repaired.")
		}

		started, err := h.promptStore.StartAssistantPromptRound(c.UserContext(), guildID, prompt.ID, 1+h.maxRepairs, now)
		if err != nil {
			return fmt.Errorf("failed to start assistant prompt round: %w", err)
		}
		if !started {
			return handlers.BadRequest("repair_limit", "The AI couldn't fix its changes. Try describing the change differently.")
		}
	} else {
		prompt = &model.AssistantPrompt{
			ID:        common.InternalID(),
			GuildID:   guildID,
			UserID:    session.UserID,
			Model:     h.assistant.Model(),
			Prompt:    req.Messages[len(req.Messages)-1].Content,
			Edited:    true,
			Rounds:    1,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := h.promptStore.CreateAssistantPrompt(c.UserContext(), *prompt); err != nil {
			return fmt.Errorf("failed to create assistant prompt: %w", err)
		}
	}

	messages := make([]ai.Message, len(req.Messages))
	for i, m := range req.Messages {
		messages[i] = ai.Message{Role: m.Role, Content: m.Content}
	}

	res, err := h.assistant.Respond(c.UserContext(), ai.Request{
		Message:  req.Message,
		Messages: messages,
		Issues:   req.Issues,
		Guild:    guild,
		GuildID:  guildID,
		UserID:   session.UserID,
	})
	// Answers that don't change the message don't count. Ones that can't be used do, as they cost
	// as much, and so do ones with problems, as they are repaired.
	edited := isRepair || err != nil || res.MessageJSON != "" || len(res.Issues) > 0
	if res != nil {
		// Failing to record the usage shouldn't lose the answer.
		if err := h.promptStore.AddAssistantPromptUsage(c.UserContext(), guildID, prompt.ID, res.Usage, edited, time.Now().UTC()); err != nil {
			slog.Error("Failed to add assistant prompt usage", slog.String("guild_id", guildID.String()), slog.Any("error", err))
		}
	}
	if err != nil {
		// Prompts the model didn't answer at all don't count.
		if res == nil && !isRepair {
			if err := h.promptStore.DeleteAssistantPrompt(c.UserContext(), guildID, prompt.ID); err != nil {
				slog.Error("Failed to delete assistant prompt", slog.String("guild_id", guildID.String()), slog.Any("error", err))
			}
		}

		var resErr *ai.ErrResponse
		if errors.As(err, &resErr) {
			return handlers.ServiceUnavailable("assistant_failed", resErr.Message)
		}
		slog.Error("Failed to get assistant response", slog.String("guild_id", guildID.String()), slog.Any("error", err))
		return handlers.ServiceUnavailable("assistant_unavailable", "The AI assistant isn't available right now. Please try again later.")
	}

	if edited && !isRepair {
		used++
	}

	fields := make([]wire.AssistantFieldWire, len(res.Fields))
	for i, f := range res.Fields {
		fields[i] = wire.AssistantFieldWire(f)
	}

	return c.JSON(wire.AssistantChatResponseWire{
		Success: true,
		Data: wire.AssistantChatResponseDataWire{
			PromptID:    prompt.ID,
			Message:     res.Message,
			Data:        res.MessageJSON,
			BuildPrompt: res.BuildPrompt,
			Fields:      fields,
			Issues:      res.Issues,
			Usage:       wire.AssistantUsageWire{PromptsUsed: used, PromptsLimit: limit},
		},
	})
}

// checkLimits returns an error if the guild can't send another prompt this month.
func checkLimits(limit int, count model.AssistantPromptCount) error {
	if count.Edited >= limit {
		return handlers.BadRequest("resource_limit", fmt.Sprintf("You've used all %d AI prompts for this month.", limit))
	}
	if count.Total >= answerLimitFactor*limit {
		return handlers.BadRequest("resource_limit", "You've asked the AI too many questions this month.")
	}
	return nil
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
