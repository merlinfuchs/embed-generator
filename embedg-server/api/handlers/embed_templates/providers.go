package embed_templates

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jellydator/ttlcache/v3"
	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"golang.org/x/sync/singleflight"
)

const (
	fetchTimeout = 10 * time.Second
	// oEmbed and repository responses are a few KB.
	maxResponseSize = 1 << 20
	cacheTTL        = 10 * time.Minute
	cacheCapacity   = 10_000

	// Long descriptions make the card hard to read, the user can still write more.
	maxDescriptionLength = 350
	// Discord's limits for embed titles, author names and field names.
	maxTitleLength = 256
)

var (
	// ErrInvalidURL is a link that isn't one the template is for.
	ErrInvalidURL = errors.New("invalid url")
	// ErrNotFound is a link to something that doesn't exist or isn't public.
	ErrNotFound = errors.New("not found")
)

// Data is what a template fills the embed with. The app decides the layout.
type Data struct {
	Provider     string
	ProviderName string
	Title        string
	URL          string
	Description  string
	AuthorName   string
	AuthorURL    string
	AuthorIcon   string
	ImageURL     string
	ThumbnailURL string
	Fields       []Field
}

type Field struct {
	Name  string
	Value string
}

// provider turns a link into Data. Every provider calls a fixed host and only sends
// it the ID taken from the user's link, never the link itself, so the server can't
// be pointed at anything else.
type provider struct {
	name  string
	parse func(u *url.URL) (string, bool)
	fetch func(ctx context.Context, f *Fetcher, id string) (*Data, error)
}

// Fetcher looks up the links that the dynamic templates are built from.
type Fetcher struct {
	client       *http.Client
	baseURLs     baseURLs
	providers    map[string]provider
	cache        *ttlcache.Cache[string, *Data]
	singleFlight singleflight.Group
}

// The hosts the providers call, replaced in tests.
type baseURLs struct {
	youtube string
	// YouTube's thumbnails, which live on their own host.
	ytimg   string
	vimeo   string
	spotify string
	github  string
}

var defaultBaseURLs = baseURLs{
	youtube: "https://www.youtube.com",
	ytimg:   "https://i.ytimg.com",
	vimeo:   "https://vimeo.com",
	spotify: "https://open.spotify.com",
	github:  "https://api.github.com",
}

func NewFetcher() *Fetcher {
	return newFetcher(defaultBaseURLs)
}

func newFetcher(base baseURLs) *Fetcher {
	cache := ttlcache.New(
		ttlcache.WithTTL[string, *Data](cacheTTL),
		ttlcache.WithCapacity[string, *Data](cacheCapacity),
		ttlcache.WithDisableTouchOnHit[string, *Data](),
	)
	go cache.Start()

	return &Fetcher{
		client: &http.Client{
			Timeout: fetchTimeout,
			// The providers answer directly. Following a redirect could lead anywhere.
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		baseURLs: base,
		providers: map[string]provider{
			"youtube": {name: "YouTube", parse: parseYouTube, fetch: fetchYouTube},
			"vimeo":   {name: "Vimeo", parse: parseVimeo, fetch: fetchVimeo},
			"spotify": {name: "Spotify", parse: parseSpotify, fetch: fetchSpotify},
			"github":  {name: "GitHub", parse: parseGitHub, fetch: fetchGitHub},
		},
		cache: cache,
	}
}

// HasProvider reports whether a template with this ID exists.
func (f *Fetcher) HasProvider(id string) bool {
	_, ok := f.providers[id]
	return ok
}

// Fetch looks up the link for the template. Results are cached for a few minutes, so
// adding the same video twice doesn't ask YouTube twice.
func (f *Fetcher) Fetch(ctx context.Context, providerID string, rawURL string) (*Data, error) {
	p, ok := f.providers[providerID]
	if !ok {
		return nil, ErrInvalidURL
	}

	u, err := parseLink(rawURL)
	if err != nil {
		return nil, ErrInvalidURL
	}

	id, ok := p.parse(u)
	if !ok {
		return nil, ErrInvalidURL
	}

	return common.GetOrSet(&f.singleFlight, providerID+":"+id, f.cache, func() (*Data, error) {
		// Detached from the request, so a user closing the dialog doesn't fail the
		// lookup for everyone else waiting on it.
		ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), fetchTimeout)
		defer cancel()

		data, err := p.fetch(ctx, f, id)
		if err != nil {
			return nil, err
		}

		data.Provider = providerID
		data.ProviderName = p.name
		data.Title = truncate(data.Title, maxTitleLength)
		data.AuthorName = truncate(data.AuthorName, maxTitleLength)
		data.Description = truncate(data.Description, maxDescriptionLength)
		return data, nil
	})
}

// parseLink accepts links with or without a scheme, the way people copy them.
func parseLink(raw string) (*url.URL, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" || len(raw) > 2048 {
		return nil, ErrInvalidURL
	}
	if !strings.Contains(raw, "://") {
		raw = "https://" + raw
	}

	u, err := url.Parse(raw)
	if err != nil {
		return nil, err
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, ErrInvalidURL
	}
	return u, nil
}

func host(u *url.URL) string {
	return strings.TrimPrefix(strings.ToLower(u.Hostname()), "www.")
}

// pathParts splits the path into its non-empty segments.
func pathParts(u *url.URL) []string {
	var parts []string
	for _, p := range strings.Split(u.Path, "/") {
		if p != "" {
			parts = append(parts, p)
		}
	}
	return parts
}

func truncate(s string, max int) string {
	s = strings.TrimSpace(s)
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	runes := []rune(s)
	return strings.TrimSpace(string(runes[:max-1])) + "…"
}

// getJSON fetches a provider's JSON. A 404 or a private resource is ErrNotFound.
func (f *Fetcher) getJSON(ctx context.Context, endpoint string, headers map[string]string, v any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Embed Generator (https://message.style)")
	for k, val := range headers {
		req.Header.Set(k, val)
	}

	resp, err := f.client.Do(req)
	if err != nil {
		return fmt.Errorf("could not reach %s: %w", req.URL.Host, err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
	// oEmbed answers 401 or 403 for private and unlisted videos.
	case http.StatusNotFound, http.StatusUnauthorized, http.StatusForbidden, http.StatusBadRequest:
		return ErrNotFound
	default:
		return fmt.Errorf("%s answered with status %d", req.URL.Host, resp.StatusCode)
	}

	if err := json.NewDecoder(io.LimitReader(resp.Body, maxResponseSize)).Decode(v); err != nil {
		return fmt.Errorf("could not decode response from %s: %w", req.URL.Host, err)
	}
	return nil
}

// oEmbed is the part of an oEmbed response the templates use.
type oEmbed struct {
	Title        string `json:"title"`
	AuthorName   string `json:"author_name"`
	AuthorURL    string `json:"author_url"`
	Description  string `json:"description"`
	ThumbnailURL string `json:"thumbnail_url"`
}

func (f *Fetcher) getOEmbed(ctx context.Context, endpoint string, link string) (*oEmbed, error) {
	var res oEmbed
	err := f.getJSON(ctx, endpoint+"?format=json&url="+url.QueryEscape(link), nil, &res)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// httpsURL keeps a URL from a provider only if it's a plain https link, the only kind
// Discord shows in an embed.
func httpsURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.Host == "" {
		return ""
	}
	return u.String()
}

var youtubeIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{11}$`)

func parseYouTube(u *url.URL) (string, bool) {
	var id string
	parts := pathParts(u)

	switch host(u) {
	case "youtu.be":
		if len(parts) > 0 {
			id = parts[0]
		}
	case "youtube.com", "m.youtube.com", "music.youtube.com":
		if len(parts) == 1 && parts[0] == "watch" {
			id = u.Query().Get("v")
		} else if len(parts) >= 2 && (parts[0] == "shorts" || parts[0] == "live" || parts[0] == "embed") {
			id = parts[1]
		}
	}

	return id, youtubeIDPattern.MatchString(id)
}

func fetchYouTube(ctx context.Context, f *Fetcher, id string) (*Data, error) {
	link := "https://www.youtube.com/watch?v=" + id
	res, err := f.getOEmbed(ctx, f.baseURLs.youtube+"/oembed", link)
	if err != nil {
		return nil, err
	}

	return &Data{
		Title:      res.Title,
		URL:        link,
		AuthorName: res.AuthorName,
		AuthorURL:  httpsURL(res.AuthorURL),
		ImageURL:   f.youtubeThumbnail(ctx, id),
	}, nil
}

// youtubeThumbnail picks the full size 16:9 thumbnail when the video has one.
// oEmbed only gives hqdefault, which every video has, but it's 4:3, so a
// widescreen video gets black bars above and below. Videos without the full
// size one are mostly old 4:3 uploads, which hqdefault fits.
func (f *Fetcher) youtubeThumbnail(ctx context.Context, id string) string {
	const host = "https://i.ytimg.com/vi/"
	fallback := host + id + "/hqdefault.jpg"

	req, err := http.NewRequestWithContext(ctx, http.MethodHead, f.baseURLs.ytimg+"/vi/"+id+"/maxresdefault.jpg", nil)
	if err != nil {
		return fallback
	}
	resp, err := f.client.Do(req)
	if err != nil {
		return fallback
	}
	resp.Body.Close()

	// A missing one answers 404 with a grey placeholder image.
	if resp.StatusCode != http.StatusOK {
		return fallback
	}
	return host + id + "/maxresdefault.jpg"
}

var vimeoIDPattern = regexp.MustCompile(`^[0-9]{1,12}$`)

func parseVimeo(u *url.URL) (string, bool) {
	parts := pathParts(u)
	switch host(u) {
	case "vimeo.com":
		// vimeo.com/123 and vimeo.com/channels/staffpicks/123
		if len(parts) > 0 && vimeoIDPattern.MatchString(parts[len(parts)-1]) {
			return parts[len(parts)-1], true
		}
	case "player.vimeo.com":
		if len(parts) == 2 && parts[0] == "video" && vimeoIDPattern.MatchString(parts[1]) {
			return parts[1], true
		}
	}
	return "", false
}

func fetchVimeo(ctx context.Context, f *Fetcher, id string) (*Data, error) {
	link := "https://vimeo.com/" + id
	res, err := f.getOEmbed(ctx, f.baseURLs.vimeo+"/api/oembed.json", link)
	if err != nil {
		return nil, err
	}

	return &Data{
		Title:       res.Title,
		URL:         link,
		Description: res.Description,
		AuthorName:  res.AuthorName,
		AuthorURL:   httpsURL(res.AuthorURL),
		ImageURL:    httpsURL(res.ThumbnailURL),
	}, nil
}

var (
	spotifyTypes     = map[string]string{"track": "Song", "album": "Album", "playlist": "Playlist", "artist": "Artist", "episode": "Episode", "show": "Podcast"}
	spotifyIDPattern = regexp.MustCompile(`^[A-Za-z0-9]{22}$`)
)

func parseSpotify(u *url.URL) (string, bool) {
	if host(u) != "open.spotify.com" {
		return "", false
	}

	parts := pathParts(u)
	// Localized links look like open.spotify.com/intl-de/track/...
	if len(parts) > 0 && strings.HasPrefix(parts[0], "intl-") {
		parts = parts[1:]
	}
	if len(parts) < 2 {
		return "", false
	}
	if _, ok := spotifyTypes[parts[0]]; !ok || !spotifyIDPattern.MatchString(parts[1]) {
		return "", false
	}
	return parts[0] + "/" + parts[1], true
}

func fetchSpotify(ctx context.Context, f *Fetcher, id string) (*Data, error) {
	link := "https://open.spotify.com/" + id
	res, err := f.getOEmbed(ctx, f.baseURLs.spotify+"/oembed", link)
	if err != nil {
		return nil, err
	}

	kind := spotifyTypes[strings.SplitN(id, "/", 2)[0]]
	return &Data{
		Title:        res.Title,
		URL:          link,
		Description:  kind + " on Spotify",
		ThumbnailURL: httpsURL(res.ThumbnailURL),
	}, nil
}

// GitHub's own rules for owner and repository names.
var (
	githubOwnerPattern = regexp.MustCompile(`^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$`)
	githubRepoPattern  = regexp.MustCompile(`^[A-Za-z0-9._-]{1,100}$`)
)

func parseGitHub(u *url.URL) (string, bool) {
	if host(u) != "github.com" {
		return "", false
	}

	parts := pathParts(u)
	if len(parts) < 2 {
		return "", false
	}
	owner, repo := parts[0], strings.TrimSuffix(parts[1], ".git")
	if !githubOwnerPattern.MatchString(owner) || !githubRepoPattern.MatchString(repo) || repo == "." || repo == ".." {
		return "", false
	}
	return owner + "/" + repo, true
}

type githubRepo struct {
	FullName    string `json:"full_name"`
	HTMLURL     string `json:"html_url"`
	Description string `json:"description"`
	Stars       int    `json:"stargazers_count"`
	Forks       int    `json:"forks_count"`
	Language    string `json:"language"`
	Owner       struct {
		Login     string `json:"login"`
		HTMLURL   string `json:"html_url"`
		AvatarURL string `json:"avatar_url"`
	} `json:"owner"`
}

func fetchGitHub(ctx context.Context, f *Fetcher, id string) (*Data, error) {
	var repo githubRepo
	err := f.getJSON(ctx, f.baseURLs.github+"/repos/"+id, map[string]string{
		"Accept":               "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	}, &repo)
	if err != nil {
		return nil, err
	}

	fields := []Field{
		{Name: "⭐ Stars", Value: formatCount(repo.Stars)},
		{Name: "🍴 Forks", Value: formatCount(repo.Forks)},
	}
	if repo.Language != "" {
		fields = append(fields, Field{Name: "💻 Language", Value: repo.Language})
	}

	return &Data{
		Title:       repo.FullName,
		URL:         httpsURL(repo.HTMLURL),
		Description: repo.Description,
		AuthorName:  repo.Owner.Login,
		AuthorURL:   httpsURL(repo.Owner.HTMLURL),
		AuthorIcon:  httpsURL(repo.Owner.AvatarURL),
		// GitHub's social preview, made for every public repository.
		ImageURL: "https://opengraph.githubassets.com/1/" + repo.FullName,
		Fields:   fields,
	}, nil
}

// formatCount writes 1234567 as 1,234,567.
func formatCount(n int) string {
	s := strconv.Itoa(n)
	if n < 0 {
		return s
	}
	for i := len(s) - 3; i > 0; i -= 3 {
		s = s[:i] + "," + s[i:]
	}
	return s
}
