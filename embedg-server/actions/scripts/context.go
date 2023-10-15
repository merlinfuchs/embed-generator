package scripts

import (
	"time"

	"github.com/merlinfuchs/discordgo"
	"go.starlark.net/starlark"
	"go.starlark.net/starlarkstruct"
)

type ScriptContext struct {
	Respond     func(data *discordgo.InteractionResponse) (*discordgo.Message, error)
	Interaction *discordgo.Interaction
	KVStore     KVStore

	MaxExecutionSteps   uint64
	TotalExecutionSteps uint64

	MaxExecutionDuration time.Duration
	MaxTotalDuration     time.Duration
	StartTime            time.Time
	IdleStart            time.Time
	IdleTime             time.Duration
}

func (c *ScriptContext) Idle() {
	c.IdleStart = time.Now()
}

func (c *ScriptContext) Unidle() {
	c.IdleTime += time.Since(c.IdleStart)
}

func (c *ScriptContext) ExecutionDuration() time.Duration {
	return time.Since(c.StartTime) - c.IdleTime
}

func (c *ScriptContext) TotalDuration() time.Duration {
	return time.Since(c.StartTime)
}

func (c *ScriptContext) ToPredeclared() starlark.StringDict {
	return starlark.StringDict{
		"ctx": c.ContextStruct(),
		"kv":  c.KVStruct(),
	}
}

func (c *ScriptContext) ContextStruct() *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"interaction_id": starlark.String(c.Interaction.ID),
		"guild_id":       starlark.String(c.Interaction.GuildID),
		"channel_id":     starlark.String(c.Interaction.ChannelID),
		"user":           c.UserStruct(),
		"respond":        c.RespondBuiltin(),
	})
}

func (c *ScriptContext) RespondBuiltin() *starlark.Builtin {
	return starlark.NewBuiltin("respond", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
		ctx := thread.Local("ctx").(*ScriptContext)
		ctx.Idle()
		defer ctx.Unidle()

		var content string
		var ephemeral bool = true
		if err := starlark.UnpackArgs(b.Name(), args, kwargs, "content", &content, "ephemeral?", &ephemeral); err != nil {
			return nil, err
		}

		var flags discordgo.MessageFlags
		if ephemeral {
			flags |= discordgo.MessageFlagsEphemeral
		}

		_, err := ctx.Respond(&discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Content: content,
				Flags:   flags,
			},
		})

		// TODO: return message object

		return starlark.None, err
	})
}

func (c *ScriptContext) UserStruct() *starlarkstruct.Struct {
	user := c.Interaction.Member.User

	roleIDs := []starlark.Value{}
	for _, roleID := range c.Interaction.Member.Roles {
		roleIDs = append(roleIDs, starlark.String(roleID))
	}

	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":            starlark.String(user.ID),
		"name":          starlark.String(user.Username),
		"username":      starlark.String(user.Username),
		"global_name":   starlark.String(user.GlobalName),
		"discriminator": starlark.String(user.Discriminator),
		"avatar":        starlark.String(user.Avatar),
		"roles":         starlark.NewList(roleIDs),
		"mention": starlark.NewBuiltin("mention", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.String(user.Mention()), nil
		}),
	})
}
