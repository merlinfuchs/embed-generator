package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"maps"
	"slices"
	"strings"

	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/openai/openai-go/v2"
	"github.com/openai/openai-go/v2/responses"
	"github.com/openai/openai-go/v2/shared"
)

// maxHistory is how many earlier chat messages are sent along, so long chats don't grow the cost
// of every prompt. Older ones are dropped historyStep at a time, so the start of the input stays
// the same and cached for a few turns.
const (
	maxHistory  = 10
	historyStep = 5
)

type Config struct {
	Model           string
	ReasoningEffort string
	MaxOutputTokens int
}

// Assistant asks the model for changes to a message.
type Assistant struct {
	client *openai.Client
	config Config
}

func New(client *openai.Client, config Config) *Assistant {
	return &Assistant{client: client, config: config}
}

func (a *Assistant) Model() string {
	return a.config.Model
}

type Message struct {
	// Role is "user" or "assistant".
	Role    string
	Content string
}

type Request struct {
	// Message is the message in the editor as JSON.
	Message string
	// Messages is the chat so far, oldest first. The last one is the user's current message,
	// unless this is a repair.
	Messages []Message
	// Issues are the problems the editor found with the message of the last response, which this
	// response should fix.
	Issues  []string
	Guild   Guild
	GuildID common.ID
	UserID  common.ID
}

// Guild is what the model needs to know about the guild the message is for.
type Guild struct {
	Name string
	// HasBot is whether the bot is in the guild. Without it there are no roles or emoji, and
	// actions don't work.
	HasBot        bool
	Roles         []Role
	Emojis        []Emoji
	SavedMessages []SavedMessage
	Features      model.PlanFeatures
}

type Role struct {
	ID   common.ID
	Name string
	// Managed roles belong to bots and boosts. They can't be given to anyone, but can be checked.
	Managed bool
}

type Emoji struct {
	ID       common.ID
	Name     string
	Animated bool
}

type SavedMessage struct {
	ID   string
	Name string
}

type Response struct {
	Message string
	// MessageJSON is the new message, or empty if the answer doesn't change it.
	MessageJSON string
	// BuildPrompt is a request the user can send to make the change the message suggests.
	BuildPrompt string
	// Fields ask the user for what the assistant needs but only they know.
	Fields []Field
	// Issues are problems with the message the editor can't see, like roles the guild doesn't
	// have. They are fixed like the editor's own issues.
	Issues []string
	Usage  model.AssistantUsage
}

// ErrResponse is an error with a message that can be shown to the user.
type ErrResponse struct {
	Message string
}

func (e *ErrResponse) Error() string {
	return e.Message
}

// Respond asks the model for a response. If the model answered but the answer can't be used, it
// returns an error along with a response that only has the usage.
func (a *Assistant) Respond(ctx context.Context, req Request) (*Response, error) {
	resp, err := a.client.Responses.New(ctx, responses.ResponseNewParams{
		Model:           a.config.Model,
		Instructions:    openai.String(instructions),
		Input:           responses.ResponseNewParamsInputUnion{OfInputItemList: chatInput(req)},
		MaxOutputTokens: openai.Int(int64(a.config.MaxOutputTokens)),
		Reasoning: shared.ReasoningParam{
			Effort: shared.ReasoningEffort(a.config.ReasoningEffort),
		},
		Text: responses.ResponseTextConfigParam{
			Format: responses.ResponseFormatTextConfigUnionParam{
				OfJSONSchema: &responses.ResponseFormatTextJSONSchemaConfigParam{
					Name:   "message_answer",
					Schema: outputSchema,
					Strict: openai.Bool(false),
				},
			},
		},
		PromptCacheKey: openai.String("embedg-assistant"),
		// Lets OpenAI tell users apart for abuse detection.
		SafetyIdentifier: openai.String(common.HashBytes([]byte(req.UserID.String()))),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create response: %w", err)
	}

	usage := model.AssistantUsage{
		InputTokens:       int(resp.Usage.InputTokens),
		CachedInputTokens: int(resp.Usage.InputTokensDetails.CachedTokens),
		OutputTokens:      int(resp.Usage.OutputTokens),
	}
	slog.Info(
		"Assistant response",
		slog.String("guild_id", req.GuildID.String()),
		slog.Bool("repair", len(req.Issues) > 0),
		slog.String("status", string(resp.Status)),
		slog.String("incomplete_reason", resp.IncompleteDetails.Reason),
		slog.Int("input_tokens", usage.InputTokens),
		slog.Int("cached_input_tokens", usage.CachedInputTokens),
		slog.Int("output_tokens", usage.OutputTokens),
	)

	if resp.Status != responses.ResponseStatusCompleted {
		message := "The AI couldn't answer. Please try again."
		if resp.IncompleteDetails.Reason == "max_output_tokens" {
			message = "The AI's answer was cut off. Try asking for a smaller change."
		}
		return &Response{Usage: usage}, &ErrResponse{Message: message}
	}

	res, err := parseOutput(resp.OutputText())
	if err != nil {
		return &Response{Usage: usage}, err
	}
	res.checkIDs(req.Guild)
	res.Usage = usage
	return res, nil
}

func chatInput(req Request) responses.ResponseInputParam {
	messages := req.Messages
	var current string
	if len(req.Issues) > 0 {
		current = "The editor found these problems with your message:\n- " +
			strings.Join(req.Issues, "\n- ") +
			"\n\nFix them and return the whole message again."
	} else if len(messages) > 0 {
		current = messages[len(messages)-1].Content
		messages = messages[:len(messages)-1]
	}
	if over := len(messages) - maxHistory; over > 0 {
		messages = messages[(over+historyStep-1)/historyStep*historyStep:]
	}

	// The guild comes before the chat, so it stays cached while the chat goes on.
	input := make(responses.ResponseInputParam, 0, len(messages)+2)
	input = append(input, easyMessage(responses.EasyInputMessageRoleDeveloper, describeGuild(req.Guild)))
	for _, m := range messages {
		// Answers that only change the message have no text.
		if m.Content == "" {
			continue
		}
		role := responses.EasyInputMessageRoleUser
		if m.Role == "assistant" {
			role = responses.EasyInputMessageRoleAssistant
		}
		input = append(input, easyMessage(role, m.Content))
	}
	input = append(input, easyMessage(
		responses.EasyInputMessageRoleUser,
		fmt.Sprintf("Current message:\n%s\n\n%s", req.Message, current),
	))

	return input
}

func easyMessage(role responses.EasyInputMessageRole, content string) responses.ResponseInputItemUnionParam {
	return responses.ResponseInputItemUnionParam{
		OfMessage: &responses.EasyInputMessageParam{
			Role: role,
			Content: responses.EasyInputMessageContentUnionParam{
				OfString: openai.String(content),
			},
		},
	}
}

// maxEmojis is how many of the guild's emoji are listed. Guilds can have hundreds, and a few are
// enough to pick from.
const maxEmojis = 50

func describeGuild(guild Guild) string {
	var b strings.Builder
	if guild.Name != "" {
		fmt.Fprintf(&b, "Server: %q\n\n", guild.Name)
	}

	if !guild.HasBot {
		b.WriteString("The bot isn't in this server, so there are no roles or emoji to use, and buttons and select menus only work after the user invites it.\n")
	} else {
		b.WriteString("Roles:")
		if len(guild.Roles) == 0 {
			b.WriteString("\nNone")
		}
		for _, r := range guild.Roles {
			fmt.Fprintf(&b, "\n- %s %q", r.ID, r.Name)
			if r.Managed {
				b.WriteString(" (managed, can't be given or taken)")
			}
		}

		b.WriteString("\n\nEmoji:")
		if len(guild.Emojis) == 0 {
			b.WriteString("\nNone")
		}
		for i, e := range guild.Emojis {
			if i == maxEmojis {
				fmt.Fprintf(&b, "\n- and %d more", len(guild.Emojis)-maxEmojis)
				break
			}
			prefix := ""
			if e.Animated {
				prefix = "a"
			}
			fmt.Fprintf(&b, "\n- <%s:%s:%s>", prefix, e.Name, e.ID)
		}
		b.WriteString("\n")
	}

	b.WriteString("\nSaved messages:")
	if len(guild.SavedMessages) == 0 {
		b.WriteString("\nNone")
	}
	for _, m := range guild.SavedMessages {
		fmt.Fprintf(&b, "\n- %s %q", m.ID, m.Name)
	}

	f := guild.Features
	b.WriteString("\n\nPlan:")
	if f.ComponentsV2 {
		b.WriteString("\n- Components v2: yes")
	} else {
		b.WriteString("\n- Components v2: no")
	}
	types := make([]string, len(f.ComponentTypes))
	for i, t := range slices.Sorted(slices.Values(f.ComponentTypes)) {
		types[i] = fmt.Sprint(t)
	}
	fmt.Fprintf(&b, "\n- Component types: %s", strings.Join(types, ", "))
	fmt.Fprintf(&b, "\n- Actions per button or select menu option: %d", f.MaxActionsPerComponent)

	return b.String()
}

// output is the model's answer. The schema isn't strict, so everything but the message is read
// on its own and left out if it has the wrong shape, rather than losing the whole answer.
type output struct {
	Reply       string          `json:"reply"`
	NewMessage  json.RawMessage `json:"new_message"`
	Fields      json.RawMessage `json:"fields"`
	BuildPrompt json.RawMessage `json:"build_prompt"`
}

// Field asks the user for something only they know, like a channel.
type Field struct {
	Label       string `json:"label"`
	Description string `json:"description"`
	// Type is "text", "channel", "role" or "choice".
	Type    string   `json:"type"`
	Options []string `json:"options"`
	Default string   `json:"default"`
}

// maxFields is how many fields the editor shows at once.
const maxFields = 4

func parseOutput(text string) (*Response, error) {
	var out output
	if err := json.Unmarshal([]byte(text), &out); err != nil {
		return nil, errors.Join(&ErrResponse{Message: "The AI's answer couldn't be read. Please try again."}, err)
	}

	// Empty rather than nil, so they are sent as [] rather than null.
	res := &Response{
		Message: out.Reply,
		Issues:  []string{},
	}
	var fields []Field
	if json.Unmarshal(out.Fields, &fields) == nil {
		res.Fields = fields
	}
	var buildPrompt string
	if json.Unmarshal(out.BuildPrompt, &buildPrompt) == nil {
		res.BuildPrompt = buildPrompt
	}
	if len(out.NewMessage) > 0 && string(out.NewMessage) != "null" {
		var msg map[string]any
		if err := json.Unmarshal(out.NewMessage, &msg); err != nil || msg == nil {
			// Sent back for repair like the editor's issues, as the model can fix it.
			res.Issues = append(res.Issues, "new_message isn't a JSON object.")
		} else {
			res.MessageJSON = string(out.NewMessage)
		}
	}

	// The schema can't enforce these, and the editor can't show more fields or choices without
	// options.
	if len(res.Fields) > maxFields {
		res.Fields = res.Fields[:maxFields]
	}
	for i, f := range res.Fields {
		if f.Type == "choice" && len(f.Options) == 0 {
			res.Fields[i].Type = "text"
		}
	}

	// The suggested change was already made, or needs the fields filled in first.
	if res.MessageJSON != "" || len(res.Fields) > 0 {
		res.BuildPrompt = ""
	}
	return res, nil
}

// checkIDs reports roles and saved messages the message's actions use that the guild doesn't
// have, which the model sometimes makes up. The editor can't tell.
func (r *Response) checkIDs(guild Guild) {
	if r.MessageJSON == "" || !guild.HasBot {
		return
	}
	var msg struct {
		Actions map[string]actions.ActionSet `json:"actions"`
	}
	if err := json.Unmarshal([]byte(r.MessageJSON), &msg); err != nil {
		// The editor reports what's wrong with it.
		return
	}

	// Managed roles can only be checked.
	roles := make(map[string]bool, len(guild.Roles))
	assignable := make(map[string]bool, len(guild.Roles))
	for _, role := range guild.Roles {
		roles[role.ID.String()] = true
		assignable[role.ID.String()] = !role.Managed
	}
	saved := make(map[string]bool, len(guild.SavedMessages))
	for _, m := range guild.SavedMessages {
		saved[m.ID] = true
	}

	for _, setID := range slices.Sorted(maps.Keys(msg.Actions)) {
		for i, action := range msg.Actions[setID].Actions {
			var unknown []string
			switch action.Type {
			case actions.ActionTypeToggleRole, actions.ActionTypeAddRole, actions.ActionTypeRemoveRole:
				if !roles[action.TargetID] {
					unknown = append(unknown, "role "+action.TargetID)
				} else if !assignable[action.TargetID] {
					r.Issues = append(r.Issues, fmt.Sprintf(
						"Action %d of action set %q gives or takes the managed role %s, which isn't possible. Use another role or remove the action.",
						i+1, setID, action.TargetID,
					))
				}
			case actions.ActionTypeSavedMessageResponse, actions.ActionTypeSavedMessageDM, actions.ActionTypeSavedMessageEdit:
				if !saved[action.TargetID] {
					unknown = append(unknown, "saved message "+action.TargetID)
				}
			case actions.ActionTypePermissionCheck:
				for _, id := range action.RoleIDs {
					if !roles[id] {
						unknown = append(unknown, "role "+id)
					}
				}
			}
			for _, u := range unknown {
				r.Issues = append(r.Issues, fmt.Sprintf(
					"Action %d of action set %q uses %s, which the server doesn't have. Use one from the list, or remove the action and ask the user.",
					i+1, setID, u,
				))
			}
		}
	}
}
