package embed_links

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/helpers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/merlinfuchs/embed-generator/embedg-server/util"
)

type EmbedLinksHandler struct {
	pg *postgres.PostgresStore
}

func New(pg *postgres.PostgresStore) *EmbedLinksHandler {
	return &EmbedLinksHandler{
		pg: pg,
	}
}

func (h *EmbedLinksHandler) HandleCreateEmbedLink(c *fiber.Ctx, req wire.EmbedLinkCreateRequestWire) error {
	row, err := h.pg.Q.InsertEmbedLink(c.Context(), postgres.InsertEmbedLinkParams{
		ID:             util.UniqueID(),
		OgTitle:        req.OgTitle.NullString,
		Url:            req.Url,
		ThemeColor:     req.ThemeColor.NullString,
		OgSiteName:     req.OgSiteName.NullString,
		OgDescription:  req.OgDescription.NullString,
		OgImage:        req.OgImage.NullString,
		OeType:         req.OeType.NullString,
		OeAuthorName:   req.OeAuthorName.NullString,
		OeAuthorUrl:    req.OeAuthorUrl.NullString,
		OeProviderName: req.OeProviderName.NullString,
		OeProviderUrl:  req.OeProviderUrl.NullString,
		TwCard:         req.TwCard.NullString,
		CreatedAt:      time.Now().UTC(),
	})
	if err != nil {
		return err
	}

	return c.JSON(wire.EmbedLinkCreateResponseWire{
		Success: true,
		Data: wire.EmbedLinkCreateResponseDataWire{
			ID:  row.ID,
			URL: fmt.Sprintf("%s/e/%s", c.BaseURL(), row.ID),
		},
	})
}

func (h *EmbedLinksHandler) HandleRenderEmbedLinkHTML(c *fiber.Ctx) error {
	embedLink, err := h.pg.Q.GetEmbedLink(c.Context(), c.Params("linkID"))
	if err != nil {
		if err == sql.ErrNoRows {
			return renderUnknownEmbedLinkHTML(c)
		}
		return err
	}

	return renderEmbedLinkHTML(c, embedLink)
}

func (h *EmbedLinksHandler) HandleRenderEmbedLinkJSON(c *fiber.Ctx) error {
	embedLink, err := h.pg.Q.GetEmbedLink(c.Context(), c.Params("linkID"))
	if err != nil {
		if err == sql.ErrNoRows {
			return helpers.NotFound("embed_link_not_found", "Embed link not found")
		}
		return err
	}

	return renderEmbedLinkJSON(c, embedLink)
}
