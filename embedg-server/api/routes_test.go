package api

import (
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/gofiber/fiber/v2"
)

func staticTestApp() *fiber.App {
	dist := fstest.MapFS{
		"dist/index.html":          {Data: []byte("<!DOCTYPE html>")},
		"dist/assets/index-new.js": {Data: []byte("console.log(1)")},
		"dist/logo.svg":            {Data: []byte("<svg/>")},
	}

	app := fiber.New()
	registerFrontendRoutes(app, "/app/", dist)
	return app
}

func TestStaticCacheHeaders(t *testing.T) {
	app := staticTestApp()

	for _, tt := range []struct {
		path         string
		status       int
		cacheControl string
		contentType  string
	}{
		{"/app/", 200, noCacheControl, "text/html"},
		{"/app/editor", 200, noCacheControl, "text/html"},
		{"/app/assets/index-new.js", 200, assetCacheControl, "text/javascript"},
		// Unhashed, so it can't be immutable, but it doesn't need revalidating
		// on every load either.
		{"/app/logo.svg", 200, staticCacheControl, "image/svg+xml"},
		// A chunk from a previous deploy must 404, not resolve to index.html.
		{"/app/assets/index-old.js", 404, noCacheControl, ""},
	} {
		res, err := app.Test(httptest.NewRequest("GET", tt.path, nil))
		if err != nil {
			t.Fatalf("%s: %v", tt.path, err)
		}
		if res.StatusCode != tt.status {
			t.Errorf("%s: status = %d, want %d", tt.path, res.StatusCode, tt.status)
		}
		if got := res.Header.Get("Cache-Control"); got != tt.cacheControl {
			t.Errorf("%s: Cache-Control = %q, want %q", tt.path, got, tt.cacheControl)
		}
		if got := res.Header.Get("Content-Type"); tt.contentType != "" && !strings.Contains(got, tt.contentType) {
			t.Errorf("%s: Content-Type = %q, want %q", tt.path, got, tt.contentType)
		}
	}
}
