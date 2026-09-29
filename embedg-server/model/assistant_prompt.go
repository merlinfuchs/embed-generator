package model

import (
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
)

// AssistantPrompt is a prompt sent to the AI assistant. Repairs of the message it produced are
// added as rounds instead of counting as new prompts.
type AssistantPrompt struct {
	ID      string
	GuildID common.ID
	UserID  common.ID
	Model   string
	// Prompt is the user's message.
	Prompt string
	// Edited is whether the assistant changed the message. Only prompts that did count towards
	// the plan's limit.
	Edited    bool
	Rounds    int
	Usage     AssistantUsage
	CreatedAt time.Time
	UpdatedAt time.Time
}

// AssistantPromptCount is how many prompts a guild sent in some time.
type AssistantPromptCount struct {
	Edited int
	Total  int
}

// AssistantUsage is the tokens used by one or more model calls.
type AssistantUsage struct {
	InputTokens       int
	CachedInputTokens int
	OutputTokens      int
}
