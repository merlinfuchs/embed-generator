package embed_links

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/handlers"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/session"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/manager/phishing"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

type EmbedLinksHandlerConfig struct {
	APIPublicURL string
	AppPublicURL string
}

type EmbedLinksHandler struct {
	embedLinkStore store.EmbedLinkStore
	planStore      store.PlanStore
	phishing       *phishing.Checker
	config         EmbedLinksHandlerConfig
}

func New(config EmbedLinksHandlerConfig, embedLinkStore store.EmbedLinkStore, planStore store.PlanStore, phishing *phishing.Checker) *EmbedLinksHandler {
	return &EmbedLinksHandler{
		config:         config,
		embedLinkStore: embedLinkStore,
		planStore:      planStore,
		phishing:       phishing,
	}
}

func (h *EmbedLinksHandler) HandleCreateEmbedLink(c *fiber.Ctx, req wire.EmbedLinkCreateRequestWire) error {
	// Logging in is optional. Only a purchase of the user's own turns off the attribution.
	var userID common.NullID
	attribution := true
	if session, _ := c.Locals("session").(*session.Session); session != nil {
		userID = common.NullID{Valid: true, ID: session.UserID}

		features, err := h.planStore.GetPlanFeaturesForUser(c.UserContext(), session.UserID)
		if err != nil {
			return err
		}
		attribution = features.EmbedLinkAttribution()
	}

	// Stored as the payload that goes into the page, not as the client sent it.
	var componentEmbed []byte
	if len(req.ComponentEmbed) != 0 {
		parsed, err := model.ParseComponentEmbed(req.ComponentEmbed, attribution)
		if err != nil {
			return handlers.BadRequest("invalid_component_embed", err.Error())
		}

		componentEmbed, err = json.Marshal(parsed)
		if err != nil {
			return err
		}
	}

	embedLink := model.EmbedLink{
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
		UserID:         userID,
		Attribution:    attribution,
	}

	hosts := linkHosts(&embedLink)
	if host := h.phishing.PhishingDomain(hosts); host != "" {
		return handlers.BadRequest("phishing_link", fmt.Sprintf("Links to %s can't be used because it's on a list of known phishing sites.", host))
	}
	if host := h.phishing.ShortenerDomain(hosts); host != "" {
		return handlers.BadRequest("link_shortener", fmt.Sprintf("Links through %s can't be used because link shorteners hide where they lead. Use the full link instead.", host))
	}

	row, err := h.embedLinkStore.CreateEmbedLink(c.UserContext(), embedLink)
	if err != nil {
		return err
	}

	return c.JSON(wire.EmbedLinkCreateResponseWire{
		Success: true,
		Data: wire.EmbedLinkCreateResponseDataWire{
			ID:  row.ID,
			URL: fmt.Sprintf("%s/e/%s", h.publicURL(), row.ID),
		},
	})
}

func (h *EmbedLinksHandler) publicURL() string {
	return strings.TrimSuffix(h.config.APIPublicURL, "/api")
}

// blocked reports whether the link is flagged, and flags it when it now leads to a domain that
// was added to the phishing list after it was created.
func (h *EmbedLinksHandler) blocked(c *fiber.Ctx, embedLink *model.EmbedLink) bool {
	if embedLink.FlaggedAt.Valid {
		return true
	}

	host := h.phishing.PhishingDomain(linkHosts(embedLink))
	if host == "" {
		return false
	}

	if err := h.embedLinkStore.FlagEmbedLink(c.UserContext(), embedLink.ID, time.Now().UTC(), "phishing domain "+host); err != nil {
		slog.Error(
			"Failed to flag embed link",
			slog.String("embed_link_id", embedLink.ID),
			slog.Any("error", err),
		)
	}
	return true
}

// linkHosts returns the hosts of every link the embed link sends visitors to or shows.
func linkHosts(embedLink *model.EmbedLink) []string {
	var hosts []string
	for _, s := range []string{embedLink.Url, embedLink.OgImage.String, embedLink.OeAuthorUrl.String, embedLink.OeProviderUrl.String} {
		hosts = append(hosts, phishing.Hosts(s)...)
	}

	// Every string in the component embed, so buttons, images, and links in the text all count.
	if len(embedLink.ComponentEmbed) != 0 {
		var v any
		if err := json.Unmarshal(embedLink.ComponentEmbed, &v); err == nil {
			hosts = append(hosts, jsonStringHosts(v)...)
		}
	}

	return hosts
}

func jsonStringHosts(v any) []string {
	var hosts []string
	switch v := v.(type) {
	case string:
		hosts = phishing.Hosts(v)
	case []any:
		for _, e := range v {
			hosts = append(hosts, jsonStringHosts(e)...)
		}
	case map[string]any:
		for _, e := range v {
			hosts = append(hosts, jsonStringHosts(e)...)
		}
	}
	return hosts
}

func (h *EmbedLinksHandler) HandleRenderEmbedLinkHTML(c *fiber.Ctx) error {
	embedLink, err := h.embedLinkStore.GetEmbedLink(c.UserContext(), c.Params("linkID"))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return h.renderUnknownEmbedLinkHTML(c)
		}
		return err
	}

	if h.blocked(c, embedLink) {
		return h.renderBlockedEmbedLinkHTML(c)
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

	if h.blocked(c, embedLink) {
		return renderEmbedLinkJSON(c, &blockedEmbedLink)
	}

	return renderEmbedLinkJSON(c, embedLink)
}
