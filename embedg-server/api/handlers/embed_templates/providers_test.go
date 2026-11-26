package embed_templates

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
)

func TestParseLinks(t *testing.T) {
	tests := []struct {
		parse func(*url.URL) (string, bool)
		link  string
		want  string
	}{
		{parseYouTube, "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42", "dQw4w9WgXcQ"},
		{parseYouTube, "youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"},
		{parseYouTube, "https://m.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"},
		{parseYouTube, "https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"},
		{parseYouTube, "https://www.youtube.com/watch?v=short", ""},
		{parseYouTube, "https://www.youtube.com/@channel", ""},
		{parseYouTube, "https://evil.test/watch?v=dQw4w9WgXcQ", ""},
		{parseYouTube, "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ", ""},
		{parseVimeo, "https://vimeo.com/76979871", "76979871"},
		{parseVimeo, "https://vimeo.com/channels/staffpicks/76979871", "76979871"},
		{parseVimeo, "https://player.vimeo.com/video/76979871", "76979871"},
		{parseVimeo, "https://vimeo.com/about", ""},
		{parseSpotify, "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=x", "track/4cOdK2wGLETKBW3PvgPWqT"},
		{parseSpotify, "https://open.spotify.com/intl-de/album/4cOdK2wGLETKBW3PvgPWqT", "album/4cOdK2wGLETKBW3PvgPWqT"},
		{parseSpotify, "https://open.spotify.com/user/4cOdK2wGLETKBW3PvgPWqT", ""},
		{parseGitHub, "https://github.com/merlinfuchs/embed-generator", "merlinfuchs/embed-generator"},
		{parseGitHub, "github.com/merlinfuchs/embed-generator/tree/main/embedg-app", "merlinfuchs/embed-generator"},
		{parseGitHub, "https://github.com/merlinfuchs/embed-generator.git", "merlinfuchs/embed-generator"},
		{parseGitHub, "https://github.com/merlinfuchs", ""},
		{parseGitHub, "https://github.com/merlinfuchs/..", ""},
		{parseGitHub, "javascript://github.com/merlinfuchs/embed-generator", ""},
	}

	for _, tt := range tests {
		u, err := parseLink(tt.link)
		got, ok := "", false
		if err == nil {
			got, ok = tt.parse(u)
		}
		if tt.want == "" {
			if ok {
				t.Errorf("%s: got %q, want no match", tt.link, got)
			}
			continue
		}
		if !ok || got != tt.want {
			t.Errorf("%s: got %q (%v), want %q", tt.link, got, ok, tt.want)
		}
	}
}

func TestFetchYouTube(t *testing.T) {
	var calls atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		if r.URL.Path != "/oembed" || r.URL.Query().Get("url") != "https://www.youtube.com/watch?v=dQw4w9WgXcQ" {
			t.Errorf("unexpected request %s", r.URL)
		}
		w.Write([]byte(`{"title":"Never Gonna Give You Up","author_name":"Rick Astley","author_url":"https://www.youtube.com/@RickAstleyYT","thumbnail_url":"https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"}`))
	}))
	defer server.Close()
	thumbnails := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodHead || r.URL.Path != "/vi/dQw4w9WgXcQ/maxresdefault.jpg" {
			t.Errorf("unexpected thumbnail request %s %s", r.Method, r.URL)
		}
	}))
	defer thumbnails.Close()

	f := newFetcher(baseURLs{youtube: server.URL, ytimg: thumbnails.URL})
	for range 2 {
		data, err := f.Fetch(context.Background(), "youtube", "https://youtu.be/dQw4w9WgXcQ")
		if err != nil {
			t.Fatal(err)
		}
		if data.Title != "Never Gonna Give You Up" || data.AuthorName != "Rick Astley" || data.ProviderName != "YouTube" {
			t.Errorf("unexpected data %+v", data)
		}
		if data.URL != "https://www.youtube.com/watch?v=dQw4w9WgXcQ" || data.ImageURL != "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" {
			t.Errorf("unexpected urls %+v", data)
		}
	}
	if calls.Load() != 1 {
		t.Errorf("expected the second lookup to be cached, got %d calls", calls.Load())
	}
}

func TestYouTubeThumbnailFallsBack(t *testing.T) {
	thumbnails := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer thumbnails.Close()

	f := newFetcher(baseURLs{ytimg: thumbnails.URL})
	if got := f.youtubeThumbnail(context.Background(), "dQw4w9WgXcQ"); got != "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg" {
		t.Errorf("got %q, want the hqdefault thumbnail", got)
	}
}

func TestFetchGitHub(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/repos/merlinfuchs/embed-generator" {
			w.WriteHeader(http.StatusNotFound)
			return
		}
		w.Write([]byte(`{"full_name":"merlinfuchs/embed-generator","html_url":"https://github.com/merlinfuchs/embed-generator","description":"` + strings.Repeat("a", 500) + `","stargazers_count":1234567,"forks_count":12,"language":"Go","owner":{"login":"merlinfuchs","html_url":"https://github.com/merlinfuchs","avatar_url":"javascript:alert(1)"}}`))
	}))
	defer server.Close()

	f := newFetcher(baseURLs{github: server.URL})
	data, err := f.Fetch(context.Background(), "github", "https://github.com/merlinfuchs/embed-generator")
	if err != nil {
		t.Fatal(err)
	}
	if len(data.Fields) != 3 || data.Fields[0].Value != "1,234,567" || data.Fields[2].Value != "Go" {
		t.Errorf("unexpected fields %+v", data.Fields)
	}
	if n := len([]rune(data.Description)); n != maxDescriptionLength {
		t.Errorf("description has %d characters, want %d", n, maxDescriptionLength)
	}
	if data.AuthorIcon != "" {
		t.Errorf("expected the non-https avatar to be dropped, got %q", data.AuthorIcon)
	}

	_, err = f.Fetch(context.Background(), "github", "https://github.com/merlinfuchs/missing")
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestFetchRejectsOtherLinks(t *testing.T) {
	f := newFetcher(defaultBaseURLs)
	for _, link := range []string{"", "https://vimeo.com/76979871", "http://127.0.0.1/watch?v=dQw4w9WgXcQ"} {
		if _, err := f.Fetch(context.Background(), "youtube", link); !errors.Is(err, ErrInvalidURL) {
			t.Errorf("%q: expected ErrInvalidURL, got %v", link, err)
		}
	}
	if _, err := f.Fetch(context.Background(), "unknown", "https://youtu.be/dQw4w9WgXcQ"); !errors.Is(err, ErrInvalidURL) {
		t.Errorf("expected ErrInvalidURL for an unknown template, got %v", err)
	}
}

func TestFetchDoesNotFollowRedirects(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "http://169.254.169.254/latest/meta-data", http.StatusFound)
	}))
	defer server.Close()

	f := newFetcher(baseURLs{vimeo: server.URL})
	_, err := f.Fetch(context.Background(), "vimeo", "https://vimeo.com/76979871")
	if err == nil || errors.Is(err, ErrNotFound) || errors.Is(err, ErrInvalidURL) {
		t.Errorf("expected an upstream error, got %v", err)
	}
}
