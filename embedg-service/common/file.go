package common

import (
	"crypto/sha256"
	"fmt"
	"mime"
)

func HashBytes(b []byte) string {
	hasher := sha256.New()
	hasher.Write(b)
	return fmt.Sprintf("%x", hasher.Sum(nil))
}

func GetFileExtensionFromMimeType(mimeType string) string {
	res, err := mime.ExtensionsByType(mimeType)
	if err != nil || len(res) == 0 {
		return ""
	}

	return res[0]
}
