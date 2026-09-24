package common

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const vaultBinURL = "https://vaultb.in"

type vaultBinRequest struct {
	Content  string `json:"content"`
	Language string `json:"language"`
}

type vaultBinResponse struct {
	Data struct {
		ID string `json:"id"`
	} `json:"data"`
}

// CreateVaultBinPaste uploads JSON to vaultb.in and returns its URL, which is how commands hand
// back a message dump too large to send in Discord.
func CreateVaultBinPaste(ctx context.Context, content string) (string, error) {
	reqBody, err := json.Marshal(vaultBinRequest{
		Content:  content,
		Language: "json",
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, vaultBinURL+"/api/pastes", bytes.NewReader(reqBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Drain it so the connection goes back to the pool.
		io.Copy(io.Discard, resp.Body)
		return "", fmt.Errorf("vaultb.in returned status code %d", resp.StatusCode)
	}

	var vaultBinResp vaultBinResponse
	if err := json.NewDecoder(resp.Body).Decode(&vaultBinResp); err != nil {
		return "", err
	}

	return fmt.Sprintf("%s/%s", vaultBinURL, vaultBinResp.Data.ID), nil
}
