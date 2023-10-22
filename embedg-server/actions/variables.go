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
		replacerArgs = append(replacerArgs, fmt.Sprintf("{{%s}}", k), v)
	}

	r := strings.NewReplacer(replacerArgs...)
	return r.Replace(value)
}

func VariablesForInteraction(i *discordgo.Interaction) map[string]string {
	user := i.Member.User

	return map[string]string{
		"user":               user.Mention(),
		"user.id":            user.ID,
		"user.name":          user.Username,
		"user.username":      user.Username,
		"user.discriminator": user.Discriminator,
		"user.avatar":        user.Avatar,
		"user.global_name":   user.GlobalName,
		"user.mention":       user.Mention(),
	}
}
