package common

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/disgoorg/disgo/discord"
	"github.com/merlinfuchs/discordgo"
)

func ExecuteGuildedWebhook(ctx context.Context, webhookID, webhookToken string, params discord.WebhookMessageCreate) error {
	webhookURL := fmt.Sprintf("https://media.guilded.gg/webhooks/%s/%s", webhookID, webhookToken)

	files := params.Files
	params.Files = make([]*discord.File, 0)

	// Convert discord.File to discordgo.File
	discordgoFiles := make([]*discordgo.File, 0, len(files))
	for _, file := range files {
		discordgoFiles = append(discordgoFiles, &discordgo.File{
			Name:        file.Name,
			ContentType: "", // discord.File doesn't have ContentType
			Reader:      file.Reader,
		})
	}

	contentType, body, err := discordgo.MultipartBodyWithJSON(params, discordgoFiles)
	if err != nil {
		return fmt.Errorf("failed to construct request body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", webhookURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", contentType)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make guilded api request: %w", err)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode >= 300 || resp.StatusCode < 200 {
		return fmt.Errorf("Guilded error: %s", string(respBody))
	}

	return nil
}
