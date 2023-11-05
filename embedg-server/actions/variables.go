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

func VariablesForInteraction(i *discordgo.Interaction) map[string]string {
	user := i.Member.User

	variables := map[string]string{
		"user":               user.Mention(),
		"user.id":            user.ID,
		"user.name":          user.Username,
		"user.username":      user.Username,
		"user.discriminator": user.Discriminator,
		"user.avatar":        user.Avatar,
		"user.global_name":   user.GlobalName,
		"user.mention":       user.Mention(),
	}

	if i.Type == discordgo.InteractionApplicationCommand {
		data := i.ApplicationCommandData()

		variables["cmd"] = fmt.Sprintf("</%s:%s>", data.Name, data.ID)
		variables["cmd.id"] = data.ID
		variables["cmd.name"] = data.Name

		addOption := func(option *discordgo.ApplicationCommandInteractionDataOption) {
			key := "cmd.args." + option.Name

			switch option.Type {
			case discordgo.ApplicationCommandOptionString:
				variables[key] = option.StringValue()
			case discordgo.ApplicationCommandOptionInteger:
				variables[key] = fmt.Sprintf("%d", option.IntValue())
			case discordgo.ApplicationCommandOptionBoolean:
				variables[key] = fmt.Sprintf("%t", option.BoolValue())
			case discordgo.ApplicationCommandOptionUser:
				user := option.UserValue(nil)
				variables[key] = user.Mention()
				variables[key+".id"] = user.ID
				variables[key+".mention"] = user.Mention()

				resolved := data.Resolved.Users[user.ID]
				if resolved != nil {
					variables[key+".name"] = resolved.Username
					variables[key+".username"] = resolved.Username
					variables[key+".discriminator"] = resolved.Discriminator
					variables[key+".avatar"] = resolved.Avatar
					variables[key+".global_name"] = resolved.GlobalName
				}
			case discordgo.ApplicationCommandOptionChannel:
				channel := option.ChannelValue(nil)
				variables[key] = channel.Mention()
				variables[key+".id"] = channel.ID
				variables[key+".mention"] = channel.Mention()

				resolved := data.Resolved.Channels[channel.ID]
				if resolved != nil {
					variables[key+".name"] = resolved.Name
					variables[key+".topic"] = resolved.Topic
				}
			case discordgo.ApplicationCommandOptionRole:
				role := option.RoleValue(nil, "")
				variables[key] = role.Mention()
				variables[key+".id"] = role.ID
				variables[key+".mention"] = role.Mention()

				resolved := data.Resolved.Roles[role.ID]
				if resolved != nil {
					variables[key+".name"] = resolved.Name
				}
			case discordgo.ApplicationCommandOptionNumber:
				variables[key] = fmt.Sprintf("%f", option.FloatValue())
			case discordgo.ApplicationCommandOptionAttachment:
				resolved := data.Resolved.Attachments[option.Value.(string)]
				if resolved != nil {
					variables[key] = resolved.URL
					variables[key+".id"] = resolved.ID
					variables[key+".url"] = resolved.URL
					variables[key+".filename"] = resolved.Filename
					variables[key+".size"] = fmt.Sprintf("%d", resolved.Size)
					variables[key+".height"] = fmt.Sprintf("%d", resolved.Height)
					variables[key+".width"] = fmt.Sprintf("%d", resolved.Width)
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

	return variables
}
