package store

import (
	"context"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
)

type AssistantPromptStore interface {
	CreateAssistantPrompt(ctx context.Context, prompt model.AssistantPrompt) error
	GetAssistantPrompt(ctx context.Context, guildID common.ID, id string) (*model.AssistantPrompt, error)
	DeleteAssistantPrompt(ctx context.Context, guildID common.ID, id string) error
	// StartAssistantPromptRound records another model call for the prompt, unless it already had
	// maxRounds. It returns whether it did.
	StartAssistantPromptRound(ctx context.Context, guildID common.ID, id string, maxRounds int, updatedAt time.Time) (bool, error)
	// AddAssistantPromptUsage records the usage of a model call for the prompt, and marks it as
	// unedited if edited is false.
	AddAssistantPromptUsage(ctx context.Context, guildID common.ID, id string, usage model.AssistantUsage, edited bool, updatedAt time.Time) error
	CountAssistantPromptsSince(ctx context.Context, guildID common.ID, start time.Time) (model.AssistantPromptCount, error)
}
