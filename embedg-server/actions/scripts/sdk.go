package scripts

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/actions"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"go.starlark.net/starlark"
	"go.starlark.net/starlarkstruct"
)

type ScriptContext struct {
	Respond     func(data *discordgo.InteractionResponse) (*discordgo.Message, error)
	Interaction *discordgo.Interaction
	Session     *discordgo.Session
	State       *discordgo.State
	PG          *postgres.PostgresStore
	KVStore     KVStore

	DervivedPermissions actions.ActionDerivedPermissions

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
		"ctx":      c.ContextStruct(),
		"kv":       c.KVStruct(),
		"internal": c.InternalStruct(),
	}
}

func (c *ScriptContext) ContextStruct() *starlarkstruct.Struct {
	values := starlark.StringDict{
		"interaction_id": starlark.String(c.Interaction.ID),
		"guild_id":       starlark.String(c.Interaction.GuildID),
		"channel_id":     starlark.String(c.Interaction.ChannelID),
		"member":         c.MemberStruct(c.Interaction.Member),

		"respond": starlark.NewBuiltin("respond", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return c.respond(discordgo.InteractionResponseChannelMessageWithSource, thread, b, args, kwargs)
		}),
		"update": starlark.NewBuiltin("edit", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return c.respond(discordgo.InteractionResponseUpdateMessage, thread, b, args, kwargs)
		}),
		"defer": starlark.NewBuiltin("defer", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			var err error
			if c.Interaction.Type == discordgo.InteractionApplicationCommand {
				_, err = c.Respond(&discordgo.InteractionResponse{
					Type: discordgo.InteractionResponseDeferredChannelMessageWithSource,
				})
			} else {
				_, err = c.Respond(&discordgo.InteractionResponse{
					Type: discordgo.InteractionResponseDeferredMessageUpdate,
				})
			}

			return starlark.None, err
		}),

		"get_guild": starlark.NewBuiltin("get_guild", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			c.Idle()
			defer c.Unidle()

			guild, err := c.State.Guild(c.Interaction.GuildID)
			if err != nil {
				if err == discordgo.ErrStateNotFound {
					return starlark.None, nil
				}
				return starlark.None, err
			}

			return c.GuildStruct(guild), nil
		}),
		"get_channel": starlark.NewBuiltin("get_channel", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			c.Idle()
			defer c.Unidle()

			channel, err := c.State.Channel(c.Interaction.ChannelID)
			if err != nil {
				if err == discordgo.ErrStateNotFound {
					return starlark.None, nil
				}
				return starlark.None, err
			}

			// TODO: get context guild from cache
			return c.ChannelStruct(channel), nil
		}),
	}

	if c.Interaction.Message != nil {
		values["message"] = c.MessageStruct(c.Interaction.Message)
	}

	if c.Interaction.Type == discordgo.InteractionApplicationCommand {
		values["command"] = c.CommandStruct(c.Interaction.ApplicationCommandData())
	}

	return starlarkstruct.FromStringDict(starlarkstruct.Default, values)
}

func (c *ScriptContext) respond(t discordgo.InteractionResponseType, thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
	c.Idle()
	defer c.Unidle()

	var content string
	var ephemeral bool = true
	var rawEmbeds starlark.Value
	if err := starlark.UnpackArgs(b.Name(), args, kwargs, "content?", &content, "ephemeral?", &ephemeral, "embeds??", &rawEmbeds); err != nil {
		return nil, err
	}

	var flags discordgo.MessageFlags
	if ephemeral {
		flags |= discordgo.MessageFlagsEphemeral
	}

	var embeds []*discordgo.MessageEmbed
	if rawEmbeds != nil {
		deserializeValue(rawEmbeds, &embeds)
	}

	msg, err := c.Respond(&discordgo.InteractionResponse{
		Type: t,
		Data: &discordgo.InteractionResponseData{
			Content: content,
			Embeds:  embeds,
			Flags:   flags,
		},
	})
	if err != nil {
		return starlark.None, err
	}

	if msg == nil {
		return starlark.None, nil
	} else {
		return c.MessageStruct(msg), nil
	}
}

func (c *ScriptContext) MemberStruct(member *discordgo.Member) *starlarkstruct.Struct {
	roleIDs := []starlark.Value{}
	for _, roleID := range member.Roles {
		roleIDs = append(roleIDs, starlark.String(roleID))
	}

	dict := starlark.StringDict{
		"nick":  starlark.String(member.Nick),
		"roles": starlark.NewList(roleIDs),

		"edit": starlark.NewBuiltin("edit", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"kick": starlark.NewBuiltin("kick", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"ban": starlark.NewBuiltin("ban", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"add_roles": starlark.NewBuiltin("add_roles", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"remove_roles": starlark.NewBuiltin("remove_roles", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
	}
	c.UserStruct(member.User).ToStringDict(dict)

	return starlarkstruct.FromStringDict(starlarkstruct.Default, dict)
}

func (c *ScriptContext) UserStruct(user *discordgo.User) *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":            starlark.String(user.ID),
		"name":          starlark.String(user.Username),
		"username":      starlark.String(user.Username),
		"global_name":   starlark.String(user.GlobalName),
		"discriminator": starlark.String(user.Discriminator),
		"avatar":        starlark.String(user.Avatar),
		"mention": starlark.NewBuiltin("mention", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.String(user.Mention()), nil
		}),
	})
}

func (c *ScriptContext) MessageStruct(msg *discordgo.Message) *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":      starlark.String(msg.ID),
		"content": starlark.String(msg.Content),

		"edit": starlark.NewBuiltin("edit", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"delete": starlark.NewBuiltin("delete", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			c.Idle()
			defer c.Unidle()

			err := c.Session.ChannelMessageDelete(msg.ChannelID, msg.ID)
			return starlark.None, err
		}),
		"add_reaction": starlark.NewBuiltin("add_reaction", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			c.Idle()
			defer c.Unidle()

			var emoji string
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "emoji", &emoji); err != nil {
				return nil, err
			}

			err := c.Session.MessageReactionAdd(msg.ChannelID, msg.ID, emoji)
			return starlark.None, err
		}),
		"remove_reaction": starlark.NewBuiltin("remove_reaction", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			c.Idle()
			defer c.Unidle()

			var emoji string
			userID := "@me"
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "emoji", &emoji, "user_id?", &userID); err != nil {
				return nil, err
			}

			// TODO: check permissions if userID isn't @me

			err := c.Session.MessageReactionRemove(msg.ChannelID, msg.ID, emoji, userID)
			return starlark.None, err
		}),
		"clear_reactions": starlark.NewBuiltin("clear_reactions", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			c.Idle()
			defer c.Unidle()

			// TODO: check permissions
			err := c.Session.MessageReactionsRemoveAll(msg.ChannelID, msg.ID)
			return starlark.None, err
		}),
	})
}

func (c *ScriptContext) MessageAttachmentStruct(msg *discordgo.MessageAttachment) *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":       starlark.String(msg.ID),
		"url":      starlark.String(msg.URL),
		"filename": starlark.String(msg.Filename),
	})
}

func (c *ScriptContext) GuildStruct(guild *discordgo.Guild) *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":   starlark.String(guild.ID),
		"name": starlark.String(guild.Name),

		"get_channels": starlark.NewBuiltin("get_channels", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			res := make([]starlark.Value, len(guild.Channels))
			for i, channel := range guild.Channels {
				res[i] = c.ChannelStruct(channel)
			}
			return starlark.NewList(res), nil
		}),
		"get_channel": starlark.NewBuiltin("get_channel", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			var channelID string
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "channel_id", &channelID); err != nil {
				return nil, err
			}

			for _, channel := range guild.Channels {
				if channel.ID == channelID {
					return c.ChannelStruct(channel), nil
				}
			}

			return starlark.None, nil
		}),
		"get_roles": starlark.NewBuiltin("get_roles", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			res := make([]starlark.Value, len(guild.Roles))
			for i, role := range guild.Roles {
				res[i] = c.RoleStruct(role)
			}
			return starlark.NewList(res), nil
		}),
		"get_role": starlark.NewBuiltin("get_role", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			var roleID string
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "role_id", &roleID); err != nil {
				return nil, err
			}

			for _, role := range guild.Roles {
				if role.ID == roleID {
					return c.RoleStruct(role), nil
				}
			}

			return starlark.None, nil
		}),
		"get_member": starlark.NewBuiltin("get_member", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
	})
}

func (c *ScriptContext) ChannelStruct(channel *discordgo.Channel) *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":   starlark.String(channel.ID),
		"name": starlark.String(channel.Name),

		"edit": starlark.NewBuiltin("edit", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			// TODO: we have to check for the specific channel
			if !c.DervivedPermissions.HasGuildPermission(discordgo.PermissionManageChannels) {
				return starlark.None, fmt.Errorf("cannot delete channel, missing permissions")
			}

			return starlark.None, nil
		}),
		"delete": starlark.NewBuiltin("delete", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			if !c.DervivedPermissions.HasGuildPermission(discordgo.PermissionManageChannels) {
				return starlark.None, fmt.Errorf("cannot delete channel, missing permissions")
			}

			c.Idle()
			defer c.Unidle()

			// TODO: check permissions
			_, err := c.Session.ChannelDelete(channel.ID)
			return starlark.None, err
		}),
		"get_message": starlark.NewBuiltin("get_message", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"mention": starlark.NewBuiltin("mention", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.String(channel.Mention()), nil
		}),
	})
}

func (c *ScriptContext) RoleStruct(role *discordgo.Role) *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":   starlark.String(role.ID),
		"name": starlark.String(role.Name),

		"edit": starlark.NewBuiltin("edit", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"delete": starlark.NewBuiltin("delete", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.None, nil
		}),
		"mention": starlark.NewBuiltin("mention", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			return starlark.String(role.Mention()), nil
		}),
	})
}

func (c *ScriptContext) InternalStruct() *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"get_saved_message": starlark.NewBuiltin("get_saved_message", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			var messageID string
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "message_id", &messageID); err != nil {
				return nil, err
			}

			savedMessage, err := c.PG.Q.GetSavedMessageForGuild(context.Background(), postgres.GetSavedMessageForGuildParams{
				GuildID: sql.NullString{String: c.Interaction.GuildID, Valid: true},
				ID:      messageID,
			})
			if err != nil {
				if err == sql.ErrNoRows {
					return starlark.None, nil
				}
				return nil, err
			}

			return c.SavedMessageStruct(savedMessage), nil
		}),
	})
}

func (c *ScriptContext) SavedMessageStruct(msg postgres.SavedMessage) *starlarkstruct.Struct {
	var description starlark.Value
	if msg.Description.Valid {
		description = starlark.String(msg.Description.String)
	} else {
		description = starlark.None
	}

	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":          starlark.String(msg.ID),
		"name":        starlark.String(msg.Name),
		"description": description,
		"format": starlark.NewBuiltin("format", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			// This is used to replace variables in the message with value from the context or values passed in by the user
			return starlark.None, nil
		}),
		"get_data": starlark.NewBuiltin("get_data", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			// This is only for advanced use cases, usually you want to pass the saved message directly into the respond function

			data := make(map[string]interface{})
			if err := json.Unmarshal(msg.Data, &data); err != nil {
				return starlark.None, err
			}

			return mapToDict(data), nil
		}),
	})
}

func (c *ScriptContext) CommandStruct(cmd discordgo.ApplicationCommandInteractionData) *starlarkstruct.Struct {
	return starlarkstruct.FromStringDict(starlarkstruct.Default, starlark.StringDict{
		"id":   starlark.String(cmd.ID),
		"name": starlark.String(cmd.Name),

		"get_arg": starlark.NewBuiltin("get_arg", func(thread *starlark.Thread, b *starlark.Builtin, args starlark.Tuple, kwargs []starlark.Tuple) (starlark.Value, error) {
			var name string
			if err := starlark.UnpackArgs(b.Name(), args, kwargs, "name", &name); err != nil {
				return nil, err
			}

			var option *discordgo.ApplicationCommandInteractionDataOption
			for _, o := range cmd.Options {
				if o.Name == name {
					option = o
					break
				}
			}

			if option == nil {
				return starlark.None, nil
			}

			switch option.Type {
			case discordgo.ApplicationCommandOptionString:
				return starlark.String(option.StringValue()), nil
			case discordgo.ApplicationCommandOptionInteger:
				return starlark.MakeInt64(option.IntValue()), nil
			case discordgo.ApplicationCommandOptionNumber:
				return starlark.Float(option.FloatValue()), nil
			case discordgo.ApplicationCommandOptionBoolean:
				return starlark.Bool(option.BoolValue()), nil
			case discordgo.ApplicationCommandOptionUser:
				user := option.UserValue(nil)
				resolved := cmd.Resolved.Users[user.ID]
				if resolved != nil {
					user = resolved
				}
				return c.UserStruct(user), nil
			case discordgo.ApplicationCommandOptionChannel:
				channel := option.ChannelValue(nil)
				resolved := cmd.Resolved.Channels[channel.ID]
				if resolved != nil {
					channel = resolved
				}
				return c.ChannelStruct(channel), nil
			case discordgo.ApplicationCommandOptionRole:
				role := option.RoleValue(nil, c.Interaction.GuildID)
				resolved := cmd.Resolved.Roles[role.ID]
				if resolved != nil {
					role = resolved
				}
				return c.RoleStruct(role), nil
			case discordgo.ApplicationCommandOptionAttachment:
				attachment := cmd.Resolved.Attachments[option.Value.(string)]
				return c.MessageAttachmentStruct(attachment), nil
			}

			return starlark.None, nil
		}),
	})
}
