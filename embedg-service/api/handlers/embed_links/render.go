package embed_links

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"net/url"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
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

	metaTags += componentEmbedToHTML(el.ComponentEmbed)

	html := fmt.Sprintf(embedLinkHTML, metaTags, safeJSURL(el.Url))

	c.Set("Content-Type", "text/html")
	return c.SendString(html)
}

// The payload Discord renders instead of the meta tags, which stay as the
// fallback for everywhere else. The column is jsonb, which normalizes away the
// escaping json.Marshal did when the link was created, so `<`, `>` and `&` are
// escaped again here: nothing in the payload may close the script element.
func componentEmbedToHTML(raw []byte) string {
	if len(raw) == 0 {
		return ""
	}

	var html bytes.Buffer
	html.WriteString(`<script id="discord:component-embed" type="application/json">`)
	json.HTMLEscape(&html, raw)
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

func (h *EmbedLinksHandler) renderUnknownEmbedLinkHTML(c *fiber.Ctx) error {
	return h.renderEmbedLinkHTML(c, &model.EmbedLink{
		Url:           h.config.AppPublicURL + "/tools/links",
		OgTitle:       null.StringFrom("Unknwon Embed Link"),
		OgSiteName:    null.StringFrom("Embed Generator"),
		OgDescription: null.StringFrom("Create beautiful embed links for Discord, Slack, Twitter, and more!"),
		OgImage:       null.StringFrom("https://message.style/img/logo-256.png"),
	})
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
