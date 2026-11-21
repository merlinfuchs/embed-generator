package embed_links

import (
	"context"
	"encoding/json"
	"io"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/merlinfuchs/embed-generator/embedg-server/manager/phishing"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
	"gopkg.in/guregu/null.v4"
)

type fakeEmbedLinkStore struct {
	links   map[string]*model.EmbedLink
	flagged map[string]string
}

func (s *fakeEmbedLinkStore) CreateEmbedLink(ctx context.Context, embedLink model.EmbedLink) (*model.EmbedLink, error) {
	s.links[embedLink.ID] = &embedLink
	return &embedLink, nil
}

func (s *fakeEmbedLinkStore) GetEmbedLink(ctx context.Context, id string) (*model.EmbedLink, error) {
	if el, ok := s.links[id]; ok {
		return el, nil
	}
	return nil, store.ErrNotFound
}

func (s *fakeEmbedLinkStore) FlagEmbedLink(ctx context.Context, id string, flaggedAt time.Time, reason string) error {
	s.flagged[id] = reason
	return nil
}

func TestLinkHosts(t *testing.T) {
	got := linkHosts(&model.EmbedLink{
		Url:            "https://a.test/x",
		OgImage:        null.StringFrom("https://b.test/i.png"),
		ComponentEmbed: json.RawMessage(`{"component":{"type":17,"components":[{"type":10,"content":"[x](https://c.test)"},{"type":1,"components":[{"type":2,"url":"https://d.test"}]}]}}`),
	})
	slices.Sort(got)
	want := []string{"a.test", "b.test", "c.test", "d.test"}
	if !slices.Equal(got, want) {
		t.Errorf("linkHosts() = %v, want %v", got, want)
	}
}

func TestRenderFlagsPhishingLinks(t *testing.T) {
	checker := phishing.New(phishing.Config{})
	checker.SetDomains([]string{"evil.test"})

	links := &fakeEmbedLinkStore{
		links: map[string]*model.EmbedLink{
			"phish": {
				ID:             "phish",
				Url:            "https://example.com",
				OgTitle:        null.StringFrom("Free Nitro"),
				ComponentEmbed: json.RawMessage(`{"component":{"type":17,"components":[{"type":1,"components":[{"type":2,"style":5,"label":"Accept","url":"https://gift.evil.test/claim"}]}]}}`),
			},
			"fine": {ID: "fine", Url: "https://example.com", OgTitle: null.StringFrom("Hello")},
		},
		flagged: map[string]string{},
	}

	h := New(EmbedLinksHandlerConfig{APIPublicURL: "https://message.style/api"}, links, nil, checker)
	app := fiber.New()
	app.Get("/e/:linkID", h.HandleRenderEmbedLinkHTML)

	render := func(id string) string {
		resp, err := app.Test(httptest.NewRequest("GET", "/e/"+id, nil))
		if err != nil {
			t.Fatal(err)
		}
		body, _ := io.ReadAll(resp.Body)
		return string(body)
	}

	body := render("phish")
	if strings.Contains(body, "Free Nitro") || strings.Contains(body, "component-embed") {
		t.Errorf("flagged link still shows its preview: %s", body)
	}
	if !strings.Contains(body, "Link blocked") || !strings.Contains(body, `"https://message.style/blocked-link"`) {
		t.Errorf("flagged link doesn't show the notice: %s", body)
	}
	if links.flagged["phish"] != "phishing domain gift.evil.test" {
		t.Errorf("flagged = %v, want phish flagged for gift.evil.test", links.flagged)
	}

	if body := render("fine"); !strings.Contains(body, "Hello") || links.flagged["fine"] != "" {
		t.Errorf("link that's fine was blocked: %s", body)
	}

	// Stays blocked once flagged, even if the domain leaves the list.
	links.links["fine"].FlaggedAt = null.TimeFrom(time.Now())
	if body := render("fine"); !strings.Contains(body, "Link blocked") {
		t.Errorf("flagged link isn't blocked: %s", body)
	}
}
