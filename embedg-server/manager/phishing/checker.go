package phishing

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"sync/atomic"
	"time"

	"golang.org/x/net/idna"
)

const (
	refreshInterval = time.Hour
	fetchTimeout    = 30 * time.Second
	// The list is about 1 MB.
	maxListSize = 32 << 20
)

type Config struct {
	// DomainListURL serves a JSON array of phishing domains. Empty turns the check off.
	DomainListURL string
	// ShortenerDomains hide where a link goes, so new links can't point at them.
	ShortenerDomains []string
}

// Checker finds links to known phishing domains. Every instance downloads the list itself and
// keeps it in memory. Until the first download succeeds, nothing counts as phishing.
type Checker struct {
	config     Config
	client     *http.Client
	domains    atomic.Pointer[map[string]struct{}]
	shorteners map[string]struct{}
}

func New(config Config) *Checker {
	shorteners := make(map[string]struct{}, len(config.ShortenerDomains))
	for _, d := range config.ShortenerDomains {
		shorteners[normalizeHost(d)] = struct{}{}
	}

	return &Checker{
		config:     config,
		client:     &http.Client{Timeout: fetchTimeout},
		shorteners: shorteners,
	}
}

func (c *Checker) Run(ctx context.Context) {
	if c.config.DomainListURL == "" {
		return
	}

	ticker := time.NewTicker(refreshInterval)
	defer ticker.Stop()

	for {
		if err := c.refresh(ctx); err != nil {
			slog.Error("Failed to refresh phishing domain list", slog.Any("error", err))
		}

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (c *Checker) refresh(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.config.DomainListURL, nil)
	if err != nil {
		return err
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", resp.StatusCode)
	}

	var list []string
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxListSize)).Decode(&list); err != nil {
		return fmt.Errorf("failed to decode list: %w", err)
	}

	c.SetDomains(list)
	return nil
}

// SetDomains replaces the phishing domains.
func (c *Checker) SetDomains(list []string) {
	domains := make(map[string]struct{}, len(list))
	for _, d := range list {
		if d = normalizeHost(d); d != "" {
			domains[d] = struct{}{}
		}
	}
	c.domains.Store(&domains)
}

// PhishingDomain returns the first of the hosts that is on the phishing list or a subdomain of
// one, or "" if there is none.
func (c *Checker) PhishingDomain(hosts []string) string {
	domains := c.domains.Load()
	if domains == nil {
		return ""
	}
	return findDomain(*domains, hosts)
}

// ShortenerDomain is PhishingDomain for link shorteners.
func (c *Checker) ShortenerDomain(hosts []string) string {
	return findDomain(c.shorteners, hosts)
}

func findDomain(domains map[string]struct{}, hosts []string) string {
	for _, host := range hosts {
		// The host and each domain it's under, down to the one below the TLD.
		for d := host; strings.Contains(d, "."); d = d[strings.Index(d, ".")+1:] {
			if _, ok := domains[d]; ok {
				return host
			}
		}
	}
	return ""
}

// Browsers accept any number of slashes and backslashes after the scheme, so "https:/evil.test"
// and "https:\\evil.test" lead to evil.test too. The group is the authority, up to where the path,
// query or fragment starts.
var urlPattern = regexp.MustCompile(`(?i)https?:[/\\]*([^/\\?#\s<>"'()\[\]]+)`)

// Hosts returns the hosts of the http and https links in text, in the form a browser would go to.
func Hosts(text string) []string {
	var hosts []string
	for _, m := range urlPattern.FindAllStringSubmatch(text, -1) {
		if host := authorityHost(m[1]); host != "" {
			hosts = append(hosts, host)
		}
	}
	return hosts
}

// authorityHost returns the host of an authority like "user@Example.com:443", decoded like a
// browser does, so "%65vil.test" and lookalike Unicode domains match the list too.
func authorityHost(authority string) string {
	host := authority[strings.LastIndex(authority, "@")+1:]
	if i := strings.LastIndex(host, ":"); i != -1 {
		host = host[:i]
	}
	if unescaped, err := url.PathUnescape(host); err == nil {
		host = unescaped
	}
	if ascii, err := idna.Lookup.ToASCII(host); err == nil {
		host = ascii
	}
	return normalizeHost(host)
}

func normalizeHost(host string) string {
	return strings.TrimSuffix(strings.ToLower(strings.TrimSpace(host)), ".")
}
