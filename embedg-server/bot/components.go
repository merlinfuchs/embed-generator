package bot

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"

	"github.com/merlinfuchs/discordgo"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/rs/zerolog/log"
)

func (b *Bot) handleComponentInteraction(s *discordgo.Session, i *discordgo.Interaction, data discordgo.MessageComponentInteractionData) error {
	if strings.HasPrefix(data.CustomID, "embed:") {
		return b.handleEmbedComponentInteraction(s, i, data)
	} else {
		textResponse(s, i, "This component is not supported anymore. Please update the message at <https://message.style> to fix this.")
	}
	return nil
}

func (b *Bot) handleEmbedComponentInteraction(s *discordgo.Session, i *discordgo.Interaction, data discordgo.MessageComponentInteractionData) error {
	var currentEmbed discordgo.MessageEmbed
	if len(i.Message.Embeds) > 0 {
		currentEmbed = *i.Message.Embeds[0]
	}

	switch data.CustomID {
	case "embed:cancel":
		return s.InteractionRespond(i, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseUpdateMessage,
			Data: &discordgo.InteractionResponseData{
				Content: "You have cancalled the embed editor.",
			},
		})
	case "embed:submit":
		return modalResponse(s, i, "Send Embed", "embed:send", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:    "username",
						Label:       "Username",
						MaxLength:   80,
						Placeholder: "Embed Generator",
						Style:       discordgo.TextInputShort,
					},
				},
			},
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:    "avatar_url",
						Label:       "Avatar URL",
						Placeholder: "https://example.com/image.png",
						Style:       discordgo.TextInputShort,
					},
				},
			},
		})
	case "embed:author":
		var currentAuthor discordgo.MessageEmbedAuthor
		if currentEmbed.Author != nil {
			currentAuthor = *currentEmbed.Author
		}

		modalResponse(s, i, "Edit Embed Author", "embed:update", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:  "embed:author:name",
						Label:     "Name",
						MaxLength: 256,
						Value:     currentAuthor.Name,
						Style:     discordgo.TextInputShort,
					},
				},
			},
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:    "embed:author:url",
						Label:       "URL",
						Placeholder: "https://example.com",
						Value:       currentAuthor.URL,
						Style:       discordgo.TextInputShort,
					},
				},
			},
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:    "embed:author:icon_url",
						Label:       "Icon URL",
						Placeholder: "https://example.com/image.png",
						Value:       currentAuthor.IconURL,
						Style:       discordgo.TextInputShort,
					},
				},
			},
		})
	case "embed:title":
		modalResponse(s, i, "Edit Embed Title", "embed:update", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:  "embed:title",
						Label:     "Title",
						MaxLength: 256,
						Value:     currentEmbed.Title,
						Style:     discordgo.TextInputShort,
					},
				},
			},
		})
	case "embed:description":
		modalResponse(s, i, "Edit Embed Description", "embed:update", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID: "embed:description",
						Label:    "Description",
						Value:    currentEmbed.Title,
						Style:    discordgo.TextInputParagraph,
					},
				},
			},
		})
	case "embed:color":
		modalResponse(s, i, "Edit Embed Color", "embed:update", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:  "embed:color",
						Label:     "Color",
						MaxLength: 7,
						Value:     fmt.Sprintf("#%06x", currentEmbed.Color),
						Style:     discordgo.TextInputShort,
					},
				},
			},
		})
	case "embed:image":
		var currentImage discordgo.MessageEmbedImage
		if currentEmbed.Image != nil {
			currentImage = *currentEmbed.Image
		}

		modalResponse(s, i, "Edit Embed Image", "embed:update", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:    "embed:image",
						Label:       "Image URL",
						Value:       currentImage.URL,
						Placeholder: "https://example.com/image.png",
						Style:       discordgo.TextInputShort,
					},
				},
			},
		})
	case "embed:thumbnail":
		var currentThumbnail discordgo.MessageEmbedThumbnail
		if currentEmbed.Thumbnail != nil {
			currentThumbnail = *currentEmbed.Thumbnail
		}

		modalResponse(s, i, "Edit Embed Image", "embed:update", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:    "embed:thumbnail",
						Label:       "Thumbnail URL",
						Value:       currentThumbnail.URL,
						Placeholder: "https://example.com/image.png",
						Style:       discordgo.TextInputShort,
					},
				},
			},
		})
	case "embed:footer":
		var currentFooter discordgo.MessageEmbedFooter
		if currentEmbed.Footer != nil {
			currentFooter = *currentEmbed.Footer
		}

		modalResponse(s, i, "Edit Embed Footer", "embed:update", []discordgo.MessageComponent{
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:  "embed:footer:text",
						Label:     "Text",
						MaxLength: 2048,
						Value:     currentFooter.Text,
						Style:     discordgo.TextInputShort,
					},
				},
			},
			discordgo.ActionsRow{
				Components: []discordgo.MessageComponent{
					discordgo.TextInput{
						CustomID:    "embed:footer:icon_url",
						Label:       "Icon URL",
						Placeholder: "https://example.com/image.png",
						Value:       currentFooter.IconURL,
						Style:       discordgo.TextInputShort,
					},
				},
			},
		})
	}
	return nil
}

func (b *Bot) handleModalInteraction(s *discordgo.Session, i *discordgo.Interaction, data discordgo.ModalSubmitInteractionData) error {
	var currentEmbed discordgo.MessageEmbed
	if len(i.Message.Embeds) > 0 {
		currentEmbed = *i.Message.Embeds[0]
	}

	switch data.CustomID {
	case "embed:update":
		for _, comp := range data.Components {
			if comp.Type() != discordgo.ActionsRowComponent {
				continue
			}

			row := comp.(*discordgo.ActionsRow)
			for _, comp := range row.Components {
				if comp.Type() != discordgo.TextInputComponent {
					continue
				}

				input := comp.(*discordgo.TextInput)
				switch input.CustomID {
				case "embed:author:name":
					if currentEmbed.Author == nil {
						currentEmbed.Author = &discordgo.MessageEmbedAuthor{
							Name: input.Value,
						}
					} else {
						currentEmbed.Author.Name = input.Value
					}
				case "embed:author:url":
					if currentEmbed.Author == nil {
						currentEmbed.Author = &discordgo.MessageEmbedAuthor{
							URL: input.Value,
						}
					} else {
						currentEmbed.Author.URL = input.Value
					}
				case "embed:author:icon_url":
					if currentEmbed.Author == nil {
						currentEmbed.Author = &discordgo.MessageEmbedAuthor{
							IconURL: input.Value,
						}
					} else {
						currentEmbed.Author.IconURL = input.Value
					}
				case "embed:title":
					currentEmbed.Title = input.Value
				case "embed:description":
					currentEmbed.Description = input.Value
				case "embed:color":
					if len(input.Value) == 7 {
						color, err := strconv.ParseInt(input.Value[1:], 16, 0)
						if err == nil {
							currentEmbed.Color = int(color)
						}
					}
				case "embed:image":
					if currentEmbed.Image == nil {
						currentEmbed.Image = &discordgo.MessageEmbedImage{
							URL: input.Value,
						}
					} else {
						currentEmbed.Image.URL = input.Value
					}
				case "embed:thumbnail":
					if currentEmbed.Thumbnail == nil {
						currentEmbed.Thumbnail = &discordgo.MessageEmbedThumbnail{
							URL: input.Value,
						}
					} else {
						currentEmbed.Thumbnail.URL = input.Value
					}
				case "embed:footer:text":
					if currentEmbed.Footer == nil {
						currentEmbed.Footer = &discordgo.MessageEmbedFooter{
							Text: input.Value,
						}
					} else {
						currentEmbed.Footer.Text = input.Value
					}
				case "embed:footer:icon_url":
					if currentEmbed.Footer == nil {
						currentEmbed.Footer = &discordgo.MessageEmbedFooter{
							IconURL: input.Value,
						}
					} else {
						currentEmbed.Footer.IconURL = input.Value
					}
				}
			}
		}
	case "embed:send":
		var username string
		var avatarURL string

		for _, comp := range data.Components {
			if comp.Type() != discordgo.ActionsRowComponent {
				continue
			}

			row := comp.(*discordgo.ActionsRow)
			for _, comp := range row.Components {
				if comp.Type() != discordgo.TextInputComponent {
					continue
				}

				input := comp.(*discordgo.TextInput)
				switch input.CustomID {
				case "username":
					username = input.Value
				case "avatar_url":
					avatarURL = input.Value
				}
			}
		}

		customBot, err := b.pg.Q.GetCustomBotByGuildID(context.Background(), i.GuildID)
		if err != nil {
			if err != sql.ErrNoRows {
				log.Error().Err(err).Msg("failed to get custom bot for message username and avatar")
			}
		} else {
			if username == "" {
				username = customBot.UserName
			}
			if avatarURL == "" {
				avatarURL = util.DiscordAvatarURL(customBot.UserID, customBot.UserDiscriminator, customBot.UserAvatar.String)
			}
		}

		webhook, err := b.GetWebhookForChannel(i.ChannelID)
		if err != nil {
			return textResponse(s, i, fmt.Sprintf("Failed to get webhook for channel: `%e`", err))
		}

		if webhook.ChannelID != i.ChannelID {
			_, err = b.Session.WebhookThreadExecute(webhook.ID, webhook.Token, false, i.ChannelID, &discordgo.WebhookParams{
				Username:  username,
				AvatarURL: avatarURL,
				Embeds:    []*discordgo.MessageEmbed{&currentEmbed},
			})
		} else {
			_, err = b.Session.WebhookExecute(webhook.ID, webhook.Token, false, &discordgo.WebhookParams{
				Username:  username,
				AvatarURL: avatarURL,
				Embeds:    []*discordgo.MessageEmbed{&currentEmbed},
			})
		}

		if err != nil {
			return textResponse(s, i, fmt.Sprintf("Failed to send message: `%e`", err))
		}
	}

	return s.InteractionRespond(i, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseUpdateMessage,
		Data: &discordgo.InteractionResponseData{
			Embeds:     []*discordgo.MessageEmbed{&currentEmbed},
			Components: embedEditComponent(),
		},
	})
}

func modalResponse(s *discordgo.Session, i *discordgo.Interaction, title string, customID string, components []discordgo.MessageComponent) error {
	return s.InteractionRespond(i, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseModal,
		Data: &discordgo.InteractionResponseData{
			Title:      title,
			CustomID:   customID,
			Components: components,
		},
	})
}
