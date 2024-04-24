package util

import (
	"bytes"
	"fmt"
	"io"
	"net/http"

	"github.com/merlinfuchs/discordgo"
)

func ExecuteGuildedWebhook(webhookID, webhookToken string, params *discordgo.WebhookParams) error {
	webhookURL := fmt.Sprintf("https://media.guilded.gg/webhooks/%s/%s", webhookID, webhookToken)

	files := params.Files
	params.Files = make([]*discordgo.File, 0)

	contentType, body, err := discordgo.MultipartBodyWithJSON(params, files)
	if err != nil {
		return fmt.Errorf("failed to construct request body: %w", err)
	}

	resp, err := http.Post(webhookURL, contentType, bytes.NewReader(body))
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
