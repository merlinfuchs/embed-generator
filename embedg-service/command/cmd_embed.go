package command

import (
	"fmt"
	"strconv"

	"github.com/disgoorg/disgo/discord"
	"github.com/disgoorg/disgo/handler"
)

func (g *CommandHandler) handleEmbedCommand(e *handler.CommandEvent) error {
	return e.Respond(discord.InteractionResponseTypeCreateMessage, discord.MessageCreate{
		Content:    "If you want to have more options to customize your message go to [message.style](<https://message.style/app>)!",
		Components: embedEditComponents(),
		Flags:      discord.MessageFlagEphemeral,
	})
}

func (g *CommandHandler) handleEmbedTitleButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	embed := currentEmbed(e)

	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/update",
		Title:    "Update Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label: "Title",
				Component: discord.TextInputComponent{
					CustomID:  "/embed/title",
					MaxLength: 256,
					Value:     embed.Title,
					Style:     discord.TextInputStyleShort,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedAuthorButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	embed := currentEmbed(e)
	author := embed.Author
	if author == nil {
		author = &discord.EmbedAuthor{}
	}

	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/update",
		Title:    "Update Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label: "Author Name",
				Component: discord.TextInputComponent{
					CustomID:  "/embed/author/name",
					MaxLength: 256,
					Value:     author.Name,
					Style:     discord.TextInputStyleShort,
				},
			},
			discord.LabelComponent{
				Label: "Author URL",
				Component: discord.TextInputComponent{
					CustomID:    "/embed/author/url",
					Placeholder: "https://example.com",
					Value:       author.URL,
					Style:       discord.TextInputStyleShort,
				},
			},
			discord.LabelComponent{
				Label: "Author Icon URL",
				Component: discord.TextInputComponent{
					CustomID:    "/embed/author/icon_url",
					Placeholder: "https://example.com/image.png",
					Value:       author.IconURL,
					Style:       discord.TextInputStyleShort,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedDescriptionButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	embed := currentEmbed(e)

	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/update",
		Title:    "Update Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label: "Description",
				Component: discord.TextInputComponent{
					CustomID: "/embed/description",
					Value:    embed.Description,
					Style:    discord.TextInputStyleParagraph,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedColorButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	embed := currentEmbed(e)

	var color string
	if embed.Color != 0 {
		color = fmt.Sprintf("#%06x", embed.Color)
	}

	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/update",
		Title:    "Update Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label: "Color",
				Component: discord.TextInputComponent{
					CustomID:    "/embed/color",
					MaxLength:   7,
					Placeholder: "#rrggbb",
					Value:       color,
					Style:       discord.TextInputStyleShort,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedImageButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	embed := currentEmbed(e)

	var imageURL string
	if embed.Image != nil {
		imageURL = embed.Image.URL
	}

	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/update",
		Title:    "Update Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label: "Image URL",
				Component: discord.TextInputComponent{
					CustomID:    "/embed/image",
					Placeholder: "https://example.com/image.png",
					Value:       imageURL,
					Style:       discord.TextInputStyleShort,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedThumbnailButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	embed := currentEmbed(e)

	var thumbnailURL string
	if embed.Thumbnail != nil {
		thumbnailURL = embed.Thumbnail.URL
	}

	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/update",
		Title:    "Update Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label: "Thumbnail URL",
				Component: discord.TextInputComponent{
					CustomID:    "/embed/thumbnail",
					Placeholder: "https://example.com/image.png",
					Value:       thumbnailURL,
					Style:       discord.TextInputStyleShort,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedFooterButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	embed := currentEmbed(e)

	footer := embed.Footer
	if footer == nil {
		footer = &discord.EmbedFooter{}
	}

	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/update",
		Title:    "Update Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label: "Footer Text",
				Component: discord.TextInputComponent{
					CustomID:  "/embed/footer/text",
					MaxLength: 2048,
					Value:     footer.Text,
					Style:     discord.TextInputStyleShort,
				},
			},
			discord.LabelComponent{
				Label: "Footer Icon URL",
				Component: discord.TextInputComponent{
					CustomID:    "/embed/footer/icon_url",
					Placeholder: "https://example.com/image.png",
					Value:       footer.IconURL,
					Style:       discord.TextInputStyleShort,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedSubmitButton(data discord.ButtonInteractionData, e *handler.ComponentEvent) error {
	return e.Respond(discord.InteractionResponseTypeModal, discord.ModalCreate{
		CustomID: "/embed/send",
		Title:    "Send Embed",
		Components: []discord.LayoutComponent{
			discord.LabelComponent{
				Label:       "Username",
				Description: "Set a custom username, leave empty to use the default username.",
				Component: discord.TextInputComponent{
					CustomID:  "/embed/send/username",
					MaxLength: 256,
					Style:     discord.TextInputStyleShort,
				},
			},
			discord.LabelComponent{
				Label:       "Avatar URL",
				Description: "Set a custom avatar URL, leave empty to use the default avatar URL.",
				Component: discord.TextInputComponent{
					CustomID:    "/embed/send/avatar_url",
					Placeholder: "https://example.com/image.png",
					Style:       discord.TextInputStyleShort,
				},
			},
		},
	})
}

func (g *CommandHandler) handleEmbedUpdateModal(e *handler.ModalEvent) error {
	embed := discord.Embed{}

	message := e.Message
	if e.Message != nil && len(message.Embeds) > 0 {
		embed = message.Embeds[0]
	}

	for _, layoutComp := range e.Data.Components {
		labelComp, ok := layoutComp.(discord.LabelComponent)
		if !ok {
			continue
		}

		textInput, ok := labelComp.Component.(discord.TextInputComponent)
		if !ok {
			continue
		}

		switch textInput.CustomID {
		case "/embed/title":
			embed.Title = textInput.Value
		case "/embed/description":
			embed.Description = textInput.Value
		case "/embed/author/name":
			if embed.Author == nil {
				embed.Author = &discord.EmbedAuthor{}
			}
			embed.Author.Name = textInput.Value
			if embed.Author.Name == "" && embed.Author.URL == "" && embed.Author.IconURL == "" {
				embed.Author = nil
			}
		case "/embed/author/url":
			if embed.Author == nil {
				embed.Author = &discord.EmbedAuthor{}
			}
			embed.Author.URL = textInput.Value
			if embed.Author.Name == "" && embed.Author.URL == "" && embed.Author.IconURL == "" {
				embed.Author = nil
			}
		case "/embed/author/icon_url":
			if embed.Author == nil {
				embed.Author = &discord.EmbedAuthor{}
			}
			embed.Author.IconURL = textInput.Value
			if embed.Author.Name == "" && embed.Author.URL == "" && embed.Author.IconURL == "" {
				embed.Author = nil
			}
		case "/embed/color":
			if textInput.Value != "" {
				color, err := strconv.ParseInt(textInput.Value[1:], 16, 0)
				if err == nil {
					embed.Color = int(color)
				}
			} else {
				embed.Color = 0
			}
		case "/embed/image":
			if textInput.Value != "" {
				embed.Image = &discord.EmbedResource{
					URL: textInput.Value,
				}
			} else {
				embed.Image = nil
			}
		case "/embed/thumbnail":
			if textInput.Value != "" {
				embed.Thumbnail = &discord.EmbedResource{
					URL: textInput.Value,
				}
			} else {
				embed.Thumbnail = nil
			}
		case "/embed/footer/text":
			if embed.Footer == nil {
				embed.Footer = &discord.EmbedFooter{}
			}
			embed.Footer.Text = textInput.Value
			if embed.Footer.Text == "" && embed.Footer.IconURL == "" {
				embed.Footer = nil
			}
		case "/embed/footer/icon_url":
			if embed.Footer == nil {
				embed.Footer = &discord.EmbedFooter{}
			}
			embed.Footer.IconURL = textInput.Value
			if embed.Footer.Text == "" && embed.Footer.IconURL == "" {
				embed.Footer = nil
			}
		}
	}

	embeds := []discord.Embed{}
	components := embedEditComponents()

	if embed.Title != "" || embed.Description != "" {
		embeds = append(embeds, embed)
	}

	return e.Respond(discord.InteractionResponseTypeUpdateMessage, discord.MessageUpdate{
		Embeds:     &embeds,
		Components: &components,
	})
}

func (g *CommandHandler) handleEmbedSendModal(e *handler.ModalEvent) error {
	message := e.Message
	if message == nil || len(message.Embeds) == 0 {
		return e.Respond(discord.InteractionResponseTypeCreateMessage, discord.MessageCreate{
			Content: "Message not found or does not contain an embed.",
			Flags:   discord.MessageFlagEphemeral,
		})
	}

	embed := message.Embeds[0]

	var username string
	var avatarURL string
	for _, layoutComp := range e.Data.Components {
		labelComp, ok := layoutComp.(discord.LabelComponent)
		if !ok {
			continue
		}

		textInput, ok := labelComp.Component.(discord.TextInputComponent)
		if !ok {
			continue
		}

		switch textInput.CustomID {
		case "/embed/send/username":
			username = textInput.Value
		case "/embed/send/avatar_url":
			avatarURL = textInput.Value
		}
	}

	_, err := g.webhookManager.SendMessageToChannel(e.Ctx, message.ChannelID, discord.WebhookMessageCreate{
		Username:  username,
		AvatarURL: avatarURL,
		Embeds:    []discord.Embed{embed},
	})
	if err != nil {
		return e.Respond(discord.InteractionResponseTypeCreateMessage, discord.MessageCreate{
			Content: fmt.Sprintf("Failed to send message: %s", err.Error()),
			Flags:   discord.MessageFlagEphemeral,
		})
	}

	return e.Respond(discord.InteractionResponseTypeDeferredUpdateMessage, discord.MessageUpdate{})
}

func embedEditComponents() []discord.LayoutComponent {
	return []discord.LayoutComponent{
		discord.ActionRowComponent{
			Components: []discord.InteractiveComponent{
				discord.ButtonComponent{
					Style:    discord.ButtonStylePrimary,
					Label:    "Set Author",
					CustomID: "/embed/author",
				},
				discord.ButtonComponent{
					Style:    discord.ButtonStylePrimary,
					Label:    "Set Title",
					CustomID: "/embed/title",
				},
				discord.ButtonComponent{
					Style:    discord.ButtonStylePrimary,
					Label:    "Set Description",
					CustomID: "/embed/description",
				},
				discord.ButtonComponent{
					Style:    discord.ButtonStylePrimary,
					Label:    "Set Color",
					CustomID: "/embed/color",
				},
			},
		},
		discord.ActionRowComponent{
			Components: []discord.InteractiveComponent{
				discord.ButtonComponent{
					Style:    discord.ButtonStylePrimary,
					Label:    "Set Image",
					CustomID: "/embed/image",
				},
				discord.ButtonComponent{
					Style:    discord.ButtonStylePrimary,
					Label:    "Set Thumbnail",
					CustomID: "/embed/thumbnail",
				},
				discord.ButtonComponent{
					Style:    discord.ButtonStylePrimary,
					Label:    "Set Footer",
					CustomID: "/embed/footer",
				},
			},
		},
		discord.ActionRowComponent{
			Components: []discord.InteractiveComponent{
				discord.ButtonComponent{
					Style:    discord.ButtonStyleDanger,
					Label:    "Cancel",
					CustomID: "/embed/cancel",
				},
				discord.ButtonComponent{
					Style:    discord.ButtonStyleSuccess,
					Label:    "Send Embed",
					CustomID: "/embed/submit",
				},
			},
		},
	}
}

func currentEmbed(e *handler.ComponentEvent) discord.Embed {
	if len(e.Message.Embeds) == 0 {
		return discord.Embed{}
	}

	return e.Message.Embeds[0]
}
