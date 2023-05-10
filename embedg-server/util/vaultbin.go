package util

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type VaultBinPaste struct {
	ID string
}

func (v *VaultBinPaste) URL() string {
	return fmt.Sprintf("https://vaultb.in/%s", v.ID)
}

type vaultBinRequest struct {
	Content  string `json:"content"`
	Language string `json:"language"`
}

type vaultBinResponse struct {
	Data vaultbinResponseData `json:"data"`
}

type vaultbinResponseData struct {
	ID string `json:"id"`
}

func CreateVaultBinPaste(content string, language string) (*VaultBinPaste, error) {
	reqBody, err := json.Marshal(vaultBinRequest{
		Content:  content,
		Language: language,
	})
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", "https://vaultb.in/api/pastes", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("vaultb.in returned status code %d", resp.StatusCode)
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var vaultBinResp vaultBinResponse
	err = json.Unmarshal(respBody, &vaultBinResp)
	if err != nil {
		return nil, err
	}

	return &VaultBinPaste{
		ID: vaultBinResp.Data.ID,
	}, nil
}
