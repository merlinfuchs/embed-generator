package embedg

import (
	"context"
	"fmt"
	"strings"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

func (g *EmbedGenerator) SendMessageToChannel(ctx context.Context, channelID util.ID, params discord.WebhookMessageCreate) (*discord.Message, error) {
	// TODO: Implement
	return nil, nil
}

func (g *EmbedGenerator) UpdateMessageInChannel(ctx context.Context, channelID util.ID, messageID util.ID, params discord.WebhookMessageUpdate) (*discord.Message, error) {
	// TODO: Implement
	return nil, nil
}

func emojiImageURL(emoji string, animated bool) string {
	// Convert unicode emoji to Twemoji URL
	var codepoints []string

	// Iterate through each rune in the emoji string
	for _, r := range emoji {
		// Skip zero-width joiners and variation selectors
		if r == 0x200D || r == 0xFE0F {
			continue
		}
		// Convert rune to lowercase hex codepoint
		codepoints = append(codepoints, fmt.Sprintf("%x", r))
	}

	// Join codepoints with hyphens for multi-codepoint emojis
	unicode := strings.Join(codepoints, "-")

	if animated {
		// Google Noto animated emoji URL structure
		// https://googlefonts.github.io/noto-emoji-animation/
		return fmt.Sprintf("https://fonts.gstatic.com/s/e/notoemoji/latest/%s/512.gif", unicode)
	}

	return fmt.Sprintf("https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/%s.png", unicode)
}
