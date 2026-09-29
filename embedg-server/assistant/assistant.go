package assistant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"slices"
	"strings"

	"github.com/disgoorg/disgo/discord"
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
	// MaxRepairs is how often the model may fix its message in one prompt.
	MaxRepairs int
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
	// Messages is the chat so far, oldest first. The last one is the user's current message.
	Messages []Message
	Guild    Guild
	GuildID  common.ID
	UserID   common.ID
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
	// Issues are the problems with the message that were left after repairs, like roles the
	// guild doesn't have.
	Issues []string
	// Repairs is how often the model was asked to fix its message.
	Repairs int
	Usage   model.AssistantUsage
}

// ErrResponse is an error with a message that can be shown to the user.
type ErrResponse struct {
	Message string
}

func (e *ErrResponse) Error() string {
	return e.Message
}

// Respond asks the model for a response and has it fix the problems check finds with its message,
// up to MaxRepairs times. If the model answered but the answer can't be used, it returns an error
// along with a response that only has the usage.
func (a *Assistant) Respond(ctx context.Context, req Request) (*Response, error) {
	// Problems the message had before are the user's, and the model keeps them as they are.
	current, before := inspect(req.Message, nil, req.Guild)

	res, err := a.respond(ctx, req, nil)
	if err != nil {
		return res, err
	}
	res.MessageJSON, res.Issues = inspect(res.MessageJSON, res.Issues, req.Guild)
	res.Issues = withoutIssues(res.Issues, before)
	// The model sometimes sends the message back as it was, which isn't a change.
	if res.MessageJSON == current {
		res.MessageJSON = ""
	}

	for len(res.Issues) > 0 && res.Repairs < a.config.MaxRepairs {
		message := res.MessageJSON
		if message == "" {
			message = req.Message
		}
		next, err := a.respond(ctx, req, &repair{answer: res.Message, message: message, issues: res.Issues})
		if next != nil {
			res.Repairs++
			res.Usage = res.Usage.Add(next.Usage)
		}
		if err != nil {
			// The message so far is still better than none.
			slog.Warn("Assistant repair failed", slog.String("guild_id", req.GuildID.String()), slog.Any("error", err))
			break
		}
		// A repair without a message changes nothing, and asking again won't either.
		if next.MessageJSON == "" {
			break
		}
		res.MessageJSON, res.Issues = inspect(next.MessageJSON, next.Issues, req.Guild)
		res.Issues = withoutIssues(res.Issues, before)
	}
	return res, nil
}

// repair asks the model to fix the problems of the message it answered with.
type repair struct {
	// answer is what the model replied.
	answer  string
	message string
	issues  []string
}

func withoutIssues(issues []string, remove []string) []string {
	return slices.DeleteFunc(issues, func(issue string) bool {
		return slices.Contains(remove, issue)
	})
}

// respond makes a single model call.
func (a *Assistant) respond(ctx context.Context, req Request, repair *repair) (*Response, error) {
	resp, err := a.client.Responses.New(ctx, responses.ResponseNewParams{
		Model:           a.config.Model,
		Instructions:    openai.String(instructions),
		Input:           responses.ResponseNewParamsInputUnion{OfInputItemList: chatInput(req, repair)},
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
		// Keeps a guild's requests on the same machines, so its roles and the chat stay cached
		// between turns and repairs, not only the instructions.
		PromptCacheKey: openai.String(common.HashBytes([]byte("guild:" + req.GuildID.String()))[:32]),
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
		slog.Bool("repair", repair != nil),
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
	res.Usage = usage
	return res, nil
}

func chatInput(req Request, repair *repair) responses.ResponseInputParam {
	history := req.Messages
	var current string
	if len(history) > 0 {
		current = history[len(history)-1].Content
		history = history[:len(history)-1]
	}
	if over := len(history) - maxHistory; over > 0 {
		history = history[(over+historyStep-1)/historyStep*historyStep:]
	}

	// The guild comes before the chat, so it stays cached while the chat goes on.
	input := make(responses.ResponseInputParam, 0, len(history)+4)
	input = append(input, easyMessage(responses.EasyInputMessageRoleDeveloper, describeGuild(req.Guild)))
	for _, m := range history {
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

	if repair == nil {
		return append(input, easyMessage(
			responses.EasyInputMessageRoleUser,
			fmt.Sprintf("Current message:\n%s\n\n%s", req.Message, current),
		))
	}
	input = append(input, easyMessage(responses.EasyInputMessageRoleUser, current))
	if repair.answer != "" {
		input = append(input, easyMessage(responses.EasyInputMessageRoleAssistant, repair.answer))
	}
	return append(input, easyMessage(
		responses.EasyInputMessageRoleUser,
		fmt.Sprintf(
			"Current message:\n%s\n\nThese problems were found with your message:\n- %s\n\nFix them and return the whole message again.",
			repair.message, strings.Join(repair.issues, "\n- "),
		),
	))
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
			mention := discord.EmojiMention(e.ID, e.Name)
			if e.Animated {
				mention = discord.AnimatedEmojiMention(e.ID, e.Name)
			}
			b.WriteString("\n- " + mention)
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
	// inspect checks that it's an object.
	if len(out.NewMessage) > 0 && string(out.NewMessage) != "null" {
		res.MessageJSON = string(out.NewMessage)
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
