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

type VaultBinPaste struct {
	ID string
}

func (v *VaultBinPaste) URL() string {
	return fmt.Sprintf("%s/%s", vaultBinURL, v.ID)
}

type vaultBinRequest struct {
	Content  string `json:"content"`
	Language string `json:"language"`
}

type vaultBinResponse struct {
	Data struct {
		ID string `json:"id"`
	} `json:"data"`
}

// CreateVaultBinPaste uploads content to vaultb.in, which is how commands hand back a message
// dump that is too large to send in Discord.
func CreateVaultBinPaste(ctx context.Context, content string, language string) (*VaultBinPaste, error) {
	reqBody, err := json.Marshal(vaultBinRequest{
		Content:  content,
		Language: language,
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, vaultBinURL+"/api/pastes", bytes.NewReader(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("vaultb.in returned status code %d", resp.StatusCode)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var vaultBinResp vaultBinResponse
	if err := json.Unmarshal(respBody, &vaultBinResp); err != nil {
		return nil, err
	}

	return &VaultBinPaste{ID: vaultBinResp.Data.ID}, nil
}
