package embed_links

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
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
	// Stored as the payload that goes into the page, not as the client sent it.
	var componentEmbed []byte
	if len(req.ComponentEmbed) != 0 {
		parsed, err := model.ParseComponentEmbed(req.ComponentEmbed)
		if err != nil {
			return handlers.BadRequest("invalid_component_embed", err.Error())
		}

		componentEmbed, err = json.Marshal(parsed)
		if err != nil {
			return err
		}
	}

	row, err := h.embedLinkStore.CreateEmbedLink(c.UserContext(), model.EmbedLink{
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
		ComponentEmbed: componentEmbed,
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
	embedLink, err := h.embedLinkStore.GetEmbedLink(c.UserContext(), c.Params("linkID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return h.renderUnknownEmbedLinkHTML(c)
		}
		return err
	}

	return h.renderEmbedLinkHTML(c, embedLink)
}

func (h *EmbedLinksHandler) HandleRenderEmbedLinkJSON(c *fiber.Ctx) error {
	embedLink, err := h.embedLinkStore.GetEmbedLink(c.UserContext(), c.Params("linkID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return handlers.NotFound("embed_link_not_found", "Embed link not found")
		}
		return err
	}

	return renderEmbedLinkJSON(c, embedLink)
}
