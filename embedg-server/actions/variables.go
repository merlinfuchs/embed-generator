package actions

import (
	"fmt"
	"strings"

	"github.com/merlinfuchs/discordgo"
)

func (m *MessageWithActions) FillVariables(variables map[string]string) {
	replacerArgs := make([]string, 0, len(variables)*2)
	for k, v := range variables {
		replacerArgs = append(replacerArgs, fmt.Sprintf("{%s}", k), v)
	}

	r := strings.NewReplacer(replacerArgs...)

	m.Content = r.Replace(m.Content)
	m.Username = r.Replace(m.Username)
	m.AvatarURL = r.Replace(m.AvatarURL)

	for _, embed := range m.Embeds {
		embed.Title = r.Replace(embed.Title)
		embed.Description = r.Replace(embed.Description)
		embed.URL = r.Replace(embed.URL)

		if embed.Author != nil {
			embed.Author.Name = r.Replace(embed.Author.Name)
			embed.Author.URL = r.Replace(embed.Author.URL)
			embed.Author.IconURL = r.Replace(embed.Author.IconURL)
		}

		if embed.Footer != nil {
			embed.Footer.Text = r.Replace(embed.Footer.Text)
			embed.Footer.IconURL = r.Replace(embed.Footer.IconURL)
		}

		if embed.Image != nil {
			embed.Image.URL = r.Replace(embed.Image.URL)
		}

		if embed.Thumbnail != nil {
			embed.Thumbnail.URL = r.Replace(embed.Thumbnail.URL)
		}

		for _, field := range embed.Fields {
			field.Name = r.Replace(field.Name)
			field.Value = r.Replace(field.Value)
		}
	}
}

func FillVariables(value string, variables map[string]string) string {
	replacerArgs := make([]string, 0, len(variables)*2)
	for k, v := range variables {
		replacerArgs = append(replacerArgs, fmt.Sprintf("{%s}", k), v)
	}

	r := strings.NewReplacer(replacerArgs...)
	return r.Replace(value)
}

func VariablesForInteraction(v map[string]string, i *discordgo.Interaction) {
	user := i.Member.User

	VariablesForUser(v, user, "user")

	if i.Type == discordgo.InteractionApplicationCommand {
		data := i.ApplicationCommandData()

		v["cmd"] = fmt.Sprintf("</%s:%s>", data.Name, data.ID)
		v["cmd.id"] = data.ID
		v["cmd.name"] = data.Name

		addOption := func(option *discordgo.ApplicationCommandInteractionDataOption) {
			key := "cmd.args." + option.Name

			switch option.Type {
			case discordgo.ApplicationCommandOptionString:
				v[key] = option.StringValue()
			case discordgo.ApplicationCommandOptionInteger:
				v[key] = fmt.Sprintf("%d", option.IntValue())
			case discordgo.ApplicationCommandOptionBoolean:
				v[key] = fmt.Sprintf("%t", option.BoolValue())
			case discordgo.ApplicationCommandOptionUser:
				user := option.UserValue(nil)
				v[key] = user.Mention()
				v[key+".id"] = user.ID
				v[key+".mention"] = user.Mention()

				resolved := data.Resolved.Users[user.ID]
				if resolved != nil {
					VariablesForUser(v, resolved, key)
				}
			case discordgo.ApplicationCommandOptionChannel:
				channel := option.ChannelValue(nil)
				v[key] = channel.Mention()
				v[key+".id"] = channel.ID
				v[key+".mention"] = channel.Mention()

				resolved := data.Resolved.Channels[channel.ID]
				if resolved != nil {
					v[key+".name"] = resolved.Name
					v[key+".topic"] = resolved.Topic
				}
			case discordgo.ApplicationCommandOptionRole:
				role := option.RoleValue(nil, "")
				v[key] = role.Mention()
				v[key+".id"] = role.ID
				v[key+".mention"] = role.Mention()

				resolved := data.Resolved.Roles[role.ID]
				if resolved != nil {
					v[key+".name"] = resolved.Name
				}
			case discordgo.ApplicationCommandOptionNumber:
				v[key] = fmt.Sprintf("%f", option.FloatValue())
			case discordgo.ApplicationCommandOptionAttachment:
				resolved := data.Resolved.Attachments[option.StringValue()]
				if resolved != nil {
					v[key] = resolved.URL
					v[key+".id"] = resolved.ID
					v[key+".url"] = resolved.URL
					v[key+".filename"] = resolved.Filename
					v[key+".size"] = fmt.Sprintf("%d", resolved.Size)
					v[key+".height"] = fmt.Sprintf("%d", resolved.Height)
					v[key+".width"] = fmt.Sprintf("%d", resolved.Width)
				}
			}
		}

		for _, option1 := range data.Options {
			if option1.Type == discordgo.ApplicationCommandOptionSubCommand || option1.Type == discordgo.ApplicationCommandOptionSubCommandGroup {
				for _, option2 := range option1.Options {
					if option2.Type == discordgo.ApplicationCommandOptionSubCommand {
						for _, option3 := range option2.Options {
							addOption(option3)
						}
					} else {
						addOption(option2)
					}
				}
			} else {
				addOption(option1)
			}
		}
	}
}

func VariablesForUser(v map[string]string, u *discordgo.User, keyPrefix ...string) {
	key := strings.Join(keyPrefix, ".")

	name := u.GlobalName
	if name == "" {
		name = u.Username
	}

	v[key] = u.Mention()
	v[key+".id"] = u.ID
	v[key+".name"] = name
	v[key+".username"] = u.Username
	v[key+".discriminator"] = u.Discriminator
	v[key+".avatar"] = u.Avatar
	v[key+".avatar_url"] = u.AvatarURL("512")
	v[key+".global_name"] = u.GlobalName
	v[key+".mention"] = u.Mention()
}
