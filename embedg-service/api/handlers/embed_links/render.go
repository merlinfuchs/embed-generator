package embed_links

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-service/api/wire"
	"github.com/merlinfuchs/embed-generator/embedg-service/model"
	"github.com/spf13/viper"
	"gopkg.in/guregu/null.v4"
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

func renderEmbedLinkHTML(c *fiber.Ctx, el *model.EmbedLink) error {
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

	return renderEmbedLinkHTML(c, &model.EmbedLink{
		Url:           appURL + "/tools/links",
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
			res += `<meta property="` + key + `" content="` + value + `">` + "\n"
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
