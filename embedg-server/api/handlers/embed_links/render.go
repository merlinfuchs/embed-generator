package embed_links

import (
	"database/sql"
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-server/db/postgres"
	"github.com/spf13/viper"
)

// https://www.reddit.com/r/discordapp/comments/82p8i6/a_basic_tutorial_on_how_to_get_the_most_out_of/

const embedLinkHTML = `
<!DOCTYPE html>
<html>
<head>
%s

<script>
	window.location.replace("%s");
</script>
</head>
</html> 
`

func renderEmbedLinkHTML(c *fiber.Ctx, el postgres.EmbedLink) error {
	metaTags := metaTagsToHTML(map[string]string{
		"og:title":       el.OgTitle.String,
		"og:site_name":   el.OgSiteName.String,
		"og:description": el.OgDescription.String,
		"og:image":       el.OgImage.String,
		"theme-color":    el.ThemeColor.String,
		"twitter:card":   el.TwCard.String,
	})

	if el.ID != "" {
		oEmbedURL := fmt.Sprintf("%s/embed-links/%s/oembed", viper.GetString("api.public_url"), el.ID)
		metaTags += fmt.Sprintf(`<link type="application/json+oembed" href="%s" />`, oEmbedURL)
	}

	html := fmt.Sprintf(embedLinkHTML, metaTags, el.Url)

	c.Set("Content-Type", "text/html")
	return c.SendString(html)
}

func renderUnknownEmbedLinkHTML(c *fiber.Ctx) error {
	appURL := viper.GetString("app.public_url")

	return renderEmbedLinkHTML(c, postgres.EmbedLink{
		Url: appURL + "/tools/links",
		OgTitle: sql.NullString{
			String: "Unknwon Embed Link",
			Valid:  true,
		},
		OgSiteName: sql.NullString{
			String: "Embed Generator",
			Valid:  true,
		},
		OgDescription: sql.NullString{
			String: "Create beautiful embed links for Discord, Slack, Twitter, and more!",
			Valid:  true,
		},
		OgImage: sql.NullString{
			String: "https://message.style/img/logo-256.png",
			Valid:  true,
		},
	})
}

func metaTagsToHTML(metaTags map[string]string) string {
	res := ""

	for key, value := range metaTags {
		if value != "" {
			res += `<meta property="` + key + `" content="` + value + `">` + "\n"
		}
	}

	return res
}

func renderEmbedLinkJSON(c *fiber.Ctx, el postgres.EmbedLink) error {
	return c.JSON(wire.EmbedLinkOEmbedResponseWire{
		Type:         el.OeType.String,
		Title:        el.OgTitle.String,
		AuthorName:   el.OeAuthorName.String,
		AuthorUrl:    el.OeAuthorUrl.String,
		ProviderName: el.OeProviderName.String,
		ProviderUrl:  el.OeProviderUrl.String,
	})
}
