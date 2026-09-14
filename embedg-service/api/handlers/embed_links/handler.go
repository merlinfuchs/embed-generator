package embed_links

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/common"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/merlinfuchs/embed-generator/embedg-service/store"
)

type EmbedLinksHandlerConfig struct {
	APIPublicURL string
	AppPublicURL string
}

type EmbedLinksHandler struct {
	embedLinkStore store.EmbedLinkStore
	config         EmbedLinksHandlerConfig
}

func New(config EmbedLinksHandlerConfig, embedLinkStore store.EmbedLinkStore) *EmbedLinksHandler {
	return &EmbedLinksHandler{
		config:         config,
		embedLinkStore: embedLinkStore,
	}
}

func (h *EmbedLinksHandler) HandleCreateEmbedLink(c *fiber.Ctx, req wire.EmbedLinkCreateRequestWire) error {
	row, err := h.embedLinkStore.CreateEmbedLink(c.Context(), model.EmbedLink{
		ID:             common.InternalID(),
		OgTitle:        req.OgTitle,
		Url:            req.Url,
		ThemeColor:     req.ThemeColor,
		OgSiteName:     req.OgSiteName,
		OgDescription:  req.OgDescription,
		OgImage:        req.OgImage,
		OeType:         req.OeType,
		OeAuthorName:   req.OeAuthorName,
		OeAuthorUrl:    req.OeAuthorUrl,
		OeProviderName: req.OeProviderName,
		OeProviderUrl:  req.OeProviderUrl,
		TwCard:         req.TwCard,
		CreatedAt:      time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	publicURL := strings.TrimSuffix(h.config.APIPublicURL, "/api")

	return c.JSON(wire.EmbedLinkCreateResponseWire{
		Success: true,
		Data: wire.EmbedLinkCreateResponseDataWire{
			ID:  row.ID,
			URL: fmt.Sprintf("%s/e/%s", publicURL, row.ID),
		},
	})
}

func (h *EmbedLinksHandler) HandleRenderEmbedLinkHTML(c *fiber.Ctx) error {
	embedLink, err := h.embedLinkStore.GetEmbedLink(c.Context(), c.Params("linkID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return h.renderUnknownEmbedLinkHTML(c)
		}
		return err
	}

	return h.renderEmbedLinkHTML(c, embedLink)
}

func (h *EmbedLinksHandler) HandleRenderEmbedLinkJSON(c *fiber.Ctx) error {
	embedLink, err := h.embedLinkStore.GetEmbedLink(c.Context(), c.Params("linkID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("embed_link_not_found", "Embed link not found")
		}
		return err
	}

	return renderEmbedLinkJSON(c, embedLink)
}
