package images

import (
	"database/sql"
	"fmt"
	"io"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/premium"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/s3"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/spf13/viper"
)

type ImagesHandler struct {
	pg   *postgres.PostgresStore
	am   *access.AccessManager
	prem *premium.PremiumManager
	blob *s3.BlobStore
}

func New(pg *postgres.PostgresStore, am *access.AccessManager, prem *premium.PremiumManager, blob *s3.BlobStore) *ImagesHandler {
	return &ImagesHandler{
		pg:   pg,
		am:   am,
		prem: prem,
		blob: blob,
	}
}

func (h *ImagesHandler) HandleUploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return fmt.Errorf("could not get file from form: %w", err)
	}

	buffer, err := file.Open()
	if err != nil {
		return fmt.Errorf("could not open file: %w", err)
	}
	defer buffer.Close()

	body, err := io.ReadAll(buffer)
	if err != nil {
		return fmt.Errorf("could not read file: %w", err)
	}

	// TODO: limit upload size

	fileHash := util.HashBytes(body)
	contentType := file.Header.Get("Content-Type")
	fileKey := fileHash + util.GetFileExtensionFromMimeType(contentType)

	h.pg.Q.InsertImage(c.Context(), postgres.InsertImageParams{
		ID:              util.UniqueID(),
		UserID:          "",
		GuildID:         sql.NullString{},
		FileName:        file.Filename,
		FileHash:        fileHash,
		FileSize:        int32(len(body)),
		FileContentType: contentType,
		S3Key:           fileKey,
	})

	err = h.blob.UploadImage(c.Context(), &s3.Image{
		FileName:    fileKey,
		ContentType: contentType,
		Body:        body,
	})
	if err != nil {
		return fmt.Errorf("could not upload image: %w", err)
	}

	return nil
}

func (h *ImagesHandler) HandleGetImage(c *fiber.Ctx) error {
	return nil
}

func (h *ImagesHandler) HandleDownloadImage(c *fiber.Ctx) error {
	referer := c.Get("Referer")
	if referer != "" && !strings.HasPrefix(referer, viper.GetString("app.public_url")) {
		return fmt.Errorf("")
	}

	return nil
}
