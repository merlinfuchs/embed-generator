package images

import (
	"errors"
	"fmt"
	"io"
	"net/url"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/access"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type ImagesHandlerConfig struct {
	AppPublicURL string
	CDNPublicURL string
}

type ImagesHandler struct {
	config     ImagesHandlerConfig
	imageStore store.ImageStore
	fileStore  store.FileStore
	am         *access.AccessManager
	planStore  store.PlanStore
}

func New(config ImagesHandlerConfig, imageStore store.ImageStore, fileStore store.FileStore, am *access.AccessManager, planStore store.PlanStore) *ImagesHandler {
	return &ImagesHandler{
		config:     config,
		imageStore: imageStore,
		fileStore:  fileStore,
		am:         am,
		planStore:  planStore,
	}
}

func (h *ImagesHandler) HandleUploadImage(c *fiber.Ctx) error {
	session := c.Locals("session").(*session.Session)

	rawGuildID := c.Query("guild_id")
	var guildID common.ID

	if rawGuildID != "" {
		var err error
		guildID, err = common.ParseID(c.Query("guild_id"))
		if err != nil {
			return handlers.BadRequest("invalid_guild_id", "Invalid guild ID")
		}

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
			return handlers.Forbidden("file_too_large", "File too large, consider upgrading to Premium.")
		}
		return handlers.BadRequest("file_too_large", "File too large")
	}

	contentType := file.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return handlers.BadRequest("invalid_file_type", "Invalid file type")
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

	fileHash := common.HashBytes(body)
	fileKey := fileHash + common.GetFileExtensionFromMimeType(contentType)

	err = h.fileStore.UploadFileIfNotExists(c.Context(), model.File{
		FileName:    fileKey,
		ContentType: contentType,
		Body:        body,
	})
	if err != nil {
		return fmt.Errorf("could not upload image: %w", err)
	}

	image, err := h.imageStore.CreateImage(c.Context(), model.Image{
		ID:     common.InternalID(),
		UserID: session.UserID,
		GuildID: common.NullID{
			Valid: guildID != 0,
			ID:    guildID,
		},
		FileName:        file.Filename,
		FileHash:        fileHash,
		FileSize:        len(body),
		FileContentType: contentType,
		S3Key:           fileKey,
	})
	if err != nil {
		return fmt.Errorf("could not insert image: %w", err)
	}

	return c.JSON(wire.UploadImageResponseWire{
		Success: true,
		Data:    h.imageToWire(image),
	})
}

func (h *ImagesHandler) HandleGetImage(c *fiber.Ctx) error {
	image, err := h.imageStore.GetImage(c.Context(), c.Params("imageID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("unknown_image", "Unknown image")
		}
		return fmt.Errorf("could not get image: %w", err)
	}

	return c.JSON(wire.GetImageResponseWire{
		Success: true,
		Data:    h.imageToWire(image),
	})
}

func (h *ImagesHandler) HandleDownloadImage(c *fiber.Ctx) error {
	referer := c.Get("Referer")
	if referer != "" {
		refererURL, err := url.Parse(referer)
		if err != nil {
			return fmt.Errorf("could not parse referer: %w", err)
		}

		appURL, err := url.Parse(h.config.AppPublicURL)
		if err != nil {
			return fmt.Errorf("could not parse app url: %w", err)
		}

		if refererURL.Host != appURL.Host {
			return handlers.Forbidden("invalid_referer", "Invalid referer")
		}
	}

	file, err := h.fileStore.DownloadFile(c.Context(), c.Params("imageKey"))
	if err != nil {
		return fmt.Errorf("could not download image: %w", err)
	}

	if file == nil {
		return handlers.NotFound("unknown_image", "Unknown image")
	}

	c.Set("Content-Type", file.ContentType)
	c.Set("Content-Disposition", "inline")

	// Add security headers to prevent XSS and other attacks
	c.Set("X-Content-Type-Options", "nosniff")
	c.Set("X-Frame-Options", "DENY")
	c.Set("Content-Security-Policy", "default-src 'none'")

	return c.Send(file.Body)
}

func (h *ImagesHandler) imageToWire(image *model.Image) wire.ImageWire {
	return wire.ImageWire{
		ID:       image.ID,
		UserID:   image.UserID,
		GuildID:  image.GuildID,
		FileName: image.FileName,
		FileSize: image.FileSize,
		CDNURL:   h.config.CDNPublicURL + "/images/" + image.S3Key,
	}
}
