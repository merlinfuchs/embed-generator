package variables

import (
	"fmt"

	"github.com/merlinfuchs/discordgo"
)

type InteractionVariables struct {
	interaction *discordgo.Interaction
}

func NewInteractionVariables(interaction *discordgo.Interaction) *InteractionVariables {
	return &InteractionVariables{
		interaction: interaction,
	}
}

func (v *InteractionVariables) Get(keys ...string) *string {
	if len(keys) == 0 {
		return nil
	}

	switch keys[0] {
	case "user":
		return getFromMember(v.interaction.Member, keys[1:]...)
	case "cmd":
		if v.interaction.Type != discordgo.InteractionApplicationCommand {
			return nil
		}
		return getFromCMD(v.interaction.ApplicationCommandData(), keys[1:]...)
	}

	return nil
}

func getFromMember(m *discordgo.Member, keys ...string) *string {
	if len(keys) == 0 {
		m := m.User.Mention()
		return &m
	}

	switch keys[0] {
	case "id":
		return &m.User.ID
	case "name":
		if m.Nick != "" {
			return &m.Nick
		}
		if m.User.GlobalName != "" {
			return &m.User.GlobalName
		}
		return &m.User.Username
	case "username":
		return &m.User.Username
	case "discriminator":
		return &m.User.Discriminator
	case "avatar":
		if m.Avatar != "" {
			return &m.Avatar
		}
		return &m.User.Avatar
	case "avatar_url":
		a := m.AvatarURL("512")
		return &a
	case "banner":
		return &m.User.Banner
	case "banner_url":
		b := m.User.BannerURL("512")
		return &b
	case "global_name":
		return &m.User.GlobalName
	case "mention":
		m := m.User.Mention()
		return &m
	}

	return nil
}

func getFromUser(u *discordgo.User, keys ...string) *string {
	if len(keys) == 0 {
		m := u.Mention()
		return &m
	}

	switch keys[0] {
	case "id":
		return &u.ID
	case "name":
		if u.GlobalName != "" {
			return &u.GlobalName
		}
		return &u.Username
	case "username":
		return &u.Username
	case "discriminator":
		return &u.Discriminator
	case "avatar":
		return &u.Avatar
	case "avatar_url":
		a := u.AvatarURL("512")
		return &a
	case "banner":
		return &u.Banner
	case "banner_url":
		b := u.BannerURL("512")
		return &b
	case "global_name":
		return &u.GlobalName
	case "mention":
		m := u.Mention()
		return &m
	}

	return nil
}

func getFromCMD(cmd discordgo.ApplicationCommandInteractionData, keys ...string) *string {
	if len(keys) == 0 {
		v := fmt.Sprintf("</%s:%s>", cmd.Name, cmd.ID)
		return &v
	}

	switch keys[0] {
	case "id":
		return &cmd.ID
	case "name":
		return &cmd.Name
	case "full_name":
		res := cmd.Name
		for _, opt := range cmd.Options {
			if opt.Type == discordgo.ApplicationCommandOptionSubCommand {
				res += " " + opt.Name
			} else if opt.Type == discordgo.ApplicationCommandOptionSubCommandGroup {
				res += " " + opt.Name
				for _, opt2 := range opt.Options {
					if opt2.Type == discordgo.ApplicationCommandOptionSubCommand {
						res += " " + opt2.Name
					}
				}
			}
		}
		return &res
	case "args":
		if len(keys) < 2 {
			return nil
		}

		argName := keys[1]
		for _, opt := range cmd.Options {
			if opt.Name == argName {
				return getFromCMDOption(&cmd, opt, keys[2:]...)
			}
		}

		return nil
	}

	return nil
}

func getFromChannel(c *discordgo.Channel, keys ...string) *string {
	if len(keys) == 0 {
		v := c.Mention()
		return &v
	}

	switch keys[0] {
	case "id":
		return &c.ID
	case "name":
		return &c.Name
	case "topic":
		return &c.Topic
	case "mention":
		v := c.Mention()
		return &v
	}

	return nil
}

func getFromRole(r *discordgo.Role, keys ...string) *string {
	if len(keys) == 0 {
		v := r.Mention()
		return &v
	}

	switch keys[0] {
	case "id":
		return &r.ID
	case "name":
		return &r.Name
	case "mention":
		v := r.Mention()
		return &v
	}

	return nil
}

func getFromAttachment(a *discordgo.MessageAttachment, keys ...string) *string {
	if len(keys) == 0 {
		v := a.URL
		return &v
	}

	switch keys[0] {
	case "id":
		return &a.ID
	case "url":
		return &a.URL
	case "filename":
		return &a.Filename
	case "size":
		v := fmt.Sprintf("%d", a.Size)
		return &v
	case "height":
		v := fmt.Sprintf("%d", a.Height)
		return &v
	case "width":
		v := fmt.Sprintf("%d", a.Width)
		return &v
	}

	return nil
}

func getFromCMDOption(cmd *discordgo.ApplicationCommandInteractionData, option *discordgo.ApplicationCommandInteractionDataOption, keys ...string) *string {
	switch option.Type {
	case discordgo.ApplicationCommandOptionString:
		v := option.StringValue()
		return &v
	case discordgo.ApplicationCommandOptionInteger:
		v := fmt.Sprintf("%d", option.IntValue())
		return &v
	case discordgo.ApplicationCommandOptionBoolean:
		v := fmt.Sprintf("%t", option.BoolValue())
		return &v
	case discordgo.ApplicationCommandOptionUser:
		user := option.UserValue(nil)
		resolved := cmd.Resolved.Users[user.ID]
		if resolved != nil {
			return getFromUser(resolved, keys...)
		}
		return getFromUser(option.UserValue(nil), keys...)
	case discordgo.ApplicationCommandOptionChannel:
		channel := option.ChannelValue(nil)
		resolved := cmd.Resolved.Channels[channel.ID]
		if resolved != nil {
			return getFromChannel(resolved, keys...)
		}
		return getFromChannel(option.ChannelValue(nil), keys...)
	case discordgo.ApplicationCommandOptionRole:
		role := option.RoleValue(nil, "")
		resolved := cmd.Resolved.Roles[role.ID]
		if resolved != nil {
			return getFromRole(resolved, keys...)
		}
		return getFromRole(option.RoleValue(nil, ""), keys...)
	case discordgo.ApplicationCommandOptionNumber:
		v := fmt.Sprintf("%f", option.FloatValue())
		return &v
	case discordgo.ApplicationCommandOptionAttachment:
		attachment := cmd.Resolved.Attachments[option.Value.(string)]
		if attachment != nil {
			return getFromAttachment(attachment, keys...)
		}
		return nil
	}

	return nil
}
