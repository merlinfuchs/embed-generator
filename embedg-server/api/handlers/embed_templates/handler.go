package embed_templates

import (
	"errors"
	"log/slog"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
)

// EmbedTemplatesHandler looks up the links that dynamic embed templates, like the
// YouTube one, are built from. The browser can't ask YouTube itself.
type EmbedTemplatesHandler struct {
	fetcher *Fetcher
}

func New(fetcher *Fetcher) *EmbedTemplatesHandler {
	return &EmbedTemplatesHandler{fetcher: fetcher}
}

func (h *EmbedTemplatesHandler) HandleGetEmbedTemplateData(c *fiber.Ctx) error {
	providerID := c.Params("templateID")
	if !h.fetcher.HasProvider(providerID) {
		return handlers.NotFound("unknown_template", "Unknown template")
	}

	data, err := h.fetcher.Fetch(c.UserContext(), providerID, c.Query("url"))
	if err != nil {
		switch {
		case errors.Is(err, ErrInvalidURL):
			return handlers.BadRequest("invalid_url", "That link doesn't work with this template.")
		case errors.Is(err, ErrNotFound):
			return handlers.NotFound("unknown_link", "Nothing was found at that link. It may be private or deleted.")
		}

		slog.Warn("Failed to fetch embed template data", slog.String("template", providerID), slog.Any("error", err))
		return handlers.ServiceUnavailable("template_unavailable", "The site didn't answer. Try again in a few minutes.")
	}

	fields := make([]wire.EmbedTemplateFieldWire, len(data.Fields))
	for i, f := range data.Fields {
		fields[i] = wire.EmbedTemplateFieldWire{Name: f.Name, Value: f.Value}
	}

	return c.JSON(wire.EmbedTemplateDataResponseWire{
		Success: true,
		Data: wire.EmbedTemplateDataWire{
			Provider:      data.Provider,
			ProviderName:  data.ProviderName,
			Title:         data.Title,
			URL:           data.URL,
			Description:   data.Description,
			AuthorName:    data.AuthorName,
			AuthorURL:     data.AuthorURL,
			AuthorIconURL: data.AuthorIcon,
			ImageURL:      data.ImageURL,
			ThumbnailURL:  data.ThumbnailURL,
			Fields:        fields,
		},
	})
}
