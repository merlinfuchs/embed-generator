package actions

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/disgoorg/disgo/discord"
)

// Discord's limits on a poll.
const (
	maxPollQuestionLength = 300
	maxPollAnswers        = 10
	maxPollAnswerLength   = 55
	// maxPollDuration is 32 days in hours.
	maxPollDuration = 768
	// defaultPollDuration is what Discord uses for a poll without a duration.
	defaultPollDuration = 24
)

// Poll is a poll sent with a message, in the shape of Discord's poll create object. Only the text
// of the question is supported, answers can have an emoji next to their text.
type Poll struct {
	Question discord.PollMedia    `json:"question"`
	Answers  []discord.PollAnswer `json:"answers"`
	// Duration is in hours. Left out, the poll stays open for 24 hours.
	Duration         int                    `json:"duration,omitempty"`
	AllowMultiselect bool                   `json:"allow_multiselect,omitempty"`
	LayoutType       discord.PollLayoutType `json:"layout_type,omitempty"`
}

// Check reports what Discord would reject about the poll. Run it after templates are rendered, as
// the limits are on the text that ends up in the poll.
func (p Poll) Check() error {
	if err := checkPollText("the question", p.Question.Text, maxPollQuestionLength); err != nil {
		return err
	}

	if len(p.Answers) == 0 {
		return errors.New("it needs at least one answer")
	}
	if len(p.Answers) > maxPollAnswers {
		return fmt.Errorf("it has %d answers, more than %d", len(p.Answers), maxPollAnswers)
	}
	for i, answer := range p.Answers {
		if err := checkPollText(fmt.Sprintf("answer %d", i+1), answer.PollMedia.Text, maxPollAnswerLength); err != nil {
			return err
		}
	}

	if p.Duration < 0 || p.Duration > maxPollDuration {
		return fmt.Errorf("it stays open for %d hours, it has to be between 1 and %d", p.Duration, maxPollDuration)
	}
	return nil
}

func checkPollText(what string, text *string, max int) error {
	if text == nil || strings.TrimSpace(*text) == "" {
		return fmt.Errorf("%s is empty", what)
	}
	return checkLength(what, *text, max)
}

// Create is the poll as Discord takes it when sending a message.
func (p Poll) Create() *discord.PollCreate {
	answers := make([]discord.PollMedia, 0, len(p.Answers))
	for _, answer := range p.Answers {
		answers = append(answers, answer.PollMedia)
	}

	duration := p.Duration
	if duration == 0 {
		duration = defaultPollDuration
	}

	return &discord.PollCreate{
		Question:         p.Question,
		Answers:          answers,
		Duration:         duration,
		AllowMultiselect: p.AllowMultiselect,
		LayoutType:       p.LayoutType,
	}
}

// PollFromMessage turns the poll of a message Discord sent back into one that can be sent again.
// Discord only says when the poll ends, so the duration is how long it was open for, rounded up
// to whole hours. sentAt is when the message was sent.
func PollFromMessage(poll *discord.Poll, sentAt time.Time) *Poll {
	if poll == nil {
		return nil
	}

	answers := make([]discord.PollAnswer, 0, len(poll.Answers))
	for _, answer := range poll.Answers {
		// The ID belongs to the answer of the message that was sent, a new poll gets its own.
		answers = append(answers, discord.PollAnswer{PollMedia: answer.PollMedia})
	}

	duration := 0
	if poll.Expiry != nil {
		duration = int((poll.Expiry.Sub(sentAt) + time.Hour - 1) / time.Hour)
		duration = min(max(duration, 1), maxPollDuration)
	}

	return &Poll{
		Question:         poll.Question,
		Answers:          answers,
		Duration:         duration,
		AllowMultiselect: poll.AllowMultiselect,
		LayoutType:       poll.LayoutType,
	}
}

// PollForSend is the poll to send with a message, or nil when the message doesn't send one. The
// poll is left out of Components V2 messages, like the content and embeds Discord rejects on them.
// Discord can't change the poll of a message that was sent, so an edit leaves it as it is.
func (m MessageWithActions) PollForSend(editing bool) (*discord.PollCreate, error) {
	if m.Poll == nil || m.ComponentsV2Enabled() || editing {
		return nil, nil
	}

	if err := m.Poll.Check(); err != nil {
		return nil, err
	}
	return m.Poll.Create(), nil
}
