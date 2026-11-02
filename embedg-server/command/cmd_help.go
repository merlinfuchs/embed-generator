package command

import (
	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/handler"
)

func (g *CommandHandler) handleHelpCommand(e *handler.CommandEvent) error {
	return e.CreateMessage(discord.MessageCreate{
		Content: "Build embeds, buttons and select menus on the website, then send them through a webhook or this bot.\n\nhttps://www.youtube.com/watch?v=DnFP0MRJPIg",
		Components: []discord.LayoutComponent{
			discord.ActionRowComponent{
				Components: []discord.InteractiveComponent{
					discord.ButtonComponent{
						Style: discord.ButtonStyleLink,
						Label: "Website",
						URL:   "https://message.style",
					},
					discord.ButtonComponent{
						Style: discord.ButtonStyleLink,
						Label: "Invite Bot",
						URL:   g.appContext.AppInviteURL(),
					},
					discord.ButtonComponent{
						Style: discord.ButtonStyleLink,
						Label: "Discord Server",
						URL:   g.config.DiscordLink,
					},
				},
			},
		},
		Flags: discord.MessageFlagEphemeral,
	})
}
