package images

import (
	"database/sql"
	"fmt"
	"io"
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/access"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/s3"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
	"github.com/spf13/viper"
	"gopkg.in/guregu/null.v4"
)

var appPublicURL *url.URL

type ImagesHandler struct {
	pg        *postgres.PostgresStore
	am        *access.AccessManager
	planStore store.PlanStore
	blob      *s3.BlobStore
}

func New(pg *postgres.PostgresStore, am *access.AccessManager, planStore store.PlanStore, blob *s3.BlobStore) *ImagesHandler {
	return &ImagesHandler{
		pg:        pg,
		am:        am,
		planStore: planStore,
		blob:      blob,
	}
}

func (h *ImagesHandler) HandleUploadImage(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)
	guildID := c.Query("guild_id")
	if guildID != "" {
		if err := h.am.CheckGuildAccessForRequest(c, guildID); err != nil {
			return err
		}
	}

	file, err := c.FormFile("file")
	if err != nil {
		return fmt.Errorf("could not get file from form: %w", err)
	}

	// If guildID is empty, this will be the default max upload size
	features, err := h.planStore.GetPlanFeaturesForGuild(c.Context(), guildID)
	if err != nil {
		return fmt.Errorf("could not get plan features: %w", err)
	}

	if file.Size > int64(features.MaxImageUploadSize) {
		if !features.IsPremium {
			return helpers.Forbidden("file_too_large", "File too large, consider upgrading to Premium.")
		}
		return helpers.BadRequest("file_too_large", "File too large")
	}

	contentType := file.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return helpers.BadRequest("invalid_file_type", "Invalid file type")
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

	fileHash := util.HashBytes(body)
	fileKey := fileHash + util.GetFileExtensionFromMimeType(contentType)

	err = h.blob.UploadFileIfNotExists(c.Context(), &s3.Image{
		FileName:    fileKey,
		ContentType: contentType,
		Body:        body,
	})
	if err != nil {
		return fmt.Errorf("could not upload image: %w", err)
	}

	image, err := h.pg.Q.InsertImage(c.Context(), postgres.InsertImageParams{
		ID:     util.UniqueID(),
		UserID: session.UserID,
		GuildID: sql.NullString{
			String: guildID,
			Valid:  guildID != "",
		},
		FileName:        file.Filename,
		FileHash:        fileHash,
		FileSize:        int32(len(body)),
		FileContentType: contentType,
		S3Key:           fileKey,
	})
	if err != nil {
		return fmt.Errorf("could not insert image: %w", err)
	}

	return c.JSON(wire.UploadImageResponseWire{
		Success: true,
		Data:    imageToWire(image),
	})
}

func (h *ImagesHandler) HandleGetImage(c *fiber.Ctx) error {
	image, err := h.pg.Q.GetImage(c.Context(), c.Params("imageID"))
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("unknown_image", "Unknown image")
		}
		return fmt.Errorf("could not get image: %w", err)
	}

	return c.JSON(wire.GetImageResponseWire{
		Success: true,
		Data:    imageToWire(image),
	})
}

func (h *ImagesHandler) HandleDownloadImage(c *fiber.Ctx) error {
	referer := c.Get("Referer")
	if referer != "" {
		refererURL, err := url.Parse(referer)
		if err != nil {
			return fmt.Errorf("could not parse referer: %w", err)
		}

		appURL, err := url.Parse(viper.GetString("app.public_url"))
		if err != nil {
			return fmt.Errorf("could not parse app url: %w", err)
		}

		if refererURL.Host != appURL.Host {
			return helpers.Forbidden("invalid_referer", "Invalid referer")
		}
	}

	file, err := h.blob.DownloadFile(c.Context(), c.Params("imageKey"))
	if err != nil {
		return fmt.Errorf("could not download image: %w", err)
	}

	c.Set("Content-Type", file.ContentType)
	c.Set("Content-Disposition", "inline")

	return c.Send(file.Body)
}

func imageToWire(image postgres.Image) wire.ImageWire {
	return wire.ImageWire{
		ID:       image.ID,
		UserID:   image.UserID,
		GuildID:  null.String{NullString: image.GuildID},
		FileName: image.FileName,
		FileSize: image.FileSize,
		CDNURL:   viper.GetString("cdn.public_url") + "/images/" + image.S3Key,
	}
}
