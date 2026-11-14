package embed_links

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"net/url"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"gopkg.in/guregu/null.v4"
)

// https://www.reddit.com/r/discordapp/comments/82p8i6/a_basic_tutorial_on_how_to_get_the_most_out_of/

const embedLinkHTML = `
<!DOCTYPE html>
<html>
<head>
%s

<script>
	window.location.replace(%s);
</script>
</head>
</html> 
`

func (h *EmbedLinksHandler) renderEmbedLinkHTML(c *fiber.Ctx, el *model.EmbedLink) error {
	metaTags := metaTagsToHTML(map[string]string{
		"og:title":       el.OgTitle.String,
		"og:site_name":   el.OgSiteName.String,
		"og:description": el.OgDescription.String,
		"og:image":       el.OgImage.String,
		"theme-color":    el.ThemeColor.String,
		"twitter:card":   el.TwCard.String,
	})

	if el.ID != "" {
		oEmbedURL := fmt.Sprintf("%s/embed-links/%s/oembed", h.config.APIPublicURL, el.ID)
		metaTags += fmt.Sprintf(`<link type="application/json+oembed" href="%s" />`, oEmbedURL)
	}

	metaTags += componentEmbedToHTML(el.ComponentEmbed, el.Attribution)

	html := fmt.Sprintf(embedLinkHTML, metaTags, safeJSURL(el.Url))

	c.Set("Content-Type", "text/html")
	return c.SendString(html)
}

// The payload Discord renders instead of the meta tags, which stay as the
// fallback for everywhere else. The column is jsonb, which normalizes away the
// escaping json.Marshal did when the link was created, so `<`, `>` and `&` are
// escaped again here: nothing in the payload may close the script element.
// jsonb also adds spaces after every colon and comma, which count toward
// Discord's size limit, so they are removed again.
//
// The attribution is added here rather than stored, so links created before
// it existed get it too.
func componentEmbedToHTML(raw []byte, attribution bool) string {
	if len(raw) == 0 {
		return ""
	}

	if attribution {
		var embed model.ComponentEmbed
		if err := json.Unmarshal(raw, &embed); err != nil {
			return ""
		}

		var err error
		if raw, err = json.Marshal(embed.WithAttribution()); err != nil {
			return ""
		}
	}

	var compact bytes.Buffer
	if err := json.Compact(&compact, raw); err != nil {
		return ""
	}

	var html bytes.Buffer
	html.WriteString(`<script id="discord:component-embed" type="application/json">`)
	json.HTMLEscape(&html, compact.Bytes())
	html.WriteString("</script>\n")

	return html.String()
}

func safeJSURL(rawURL string) string {
	u, err := url.Parse(rawURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") {
		rawURL = "about:blank"
	}
	b, _ := json.Marshal(rawURL)
	return string(b)
}

// A 404, so crawlers don't index made-up link IDs. Visitors still get sent to the tool.
func (h *EmbedLinksHandler) renderUnknownEmbedLinkHTML(c *fiber.Ctx) error {
	c.Status(fiber.StatusNotFound)
	return h.renderEmbedLinkHTML(c, &model.EmbedLink{
		Url:           h.config.AppPublicURL + "/tools/embed-links",
		OgTitle:       null.StringFrom("Unknown Embed Link"),
		OgSiteName:    null.StringFrom("Embed Generator"),
		OgDescription: null.StringFrom("Create beautiful embed links for Discord, Slack, Twitter, and more!"),
		OgImage:       null.StringFrom("https://message.style/img/logo-256.png"),
	})
}

// What a flagged link shows instead of its preview.
var blockedEmbedLink = model.EmbedLink{
	OgTitle:        null.StringFrom("Link blocked"),
	OgSiteName:     null.StringFrom("Embed Generator"),
	OgDescription:  null.StringFrom("This link was blocked because it leads to a known phishing site."),
	ThemeColor:     null.StringFrom("#ef4444"),
	OeProviderName: null.StringFrom("Embed Generator"),
}

// Visitors go to a page that explains the block instead of the link's URL.
func (h *EmbedLinksHandler) renderBlockedEmbedLinkHTML(c *fiber.Ctx) error {
	el := blockedEmbedLink
	el.Url = h.publicURL() + "/blocked-link"
	return h.renderEmbedLinkHTML(c, &el)
}

func metaTagsToHTML(metaTags map[string]string) string {
	res := ""

	for key, value := range metaTags {
		if value != "" {
			res += `<meta property="` + key + `" content="` + html.EscapeString(value) + `">` + "\n"
		}
	}

	return res
}

func renderEmbedLinkJSON(c *fiber.Ctx, el *model.EmbedLink) error {
	return c.JSON(wire.EmbedLinkOEmbedResponseWire{
		Type:         el.OeType.String,
		Title:        el.OgTitle.String,
		AuthorName:   el.OeAuthorName.String,
		AuthorUrl:    el.OeAuthorUrl.String,
		ProviderName: el.OeProviderName.String,
		ProviderUrl:  el.OeProviderUrl.String,
	})
}
