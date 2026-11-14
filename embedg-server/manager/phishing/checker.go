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
	if c == nil {
		return ""
	}
	domains := c.domains.Load()
	if domains == nil {
		return ""
	}
	return findDomain(*domains, hosts)
}

// ShortenerDomain is PhishingDomain for link shorteners.
func (c *Checker) ShortenerDomain(hosts []string) string {
	if c == nil {
		return ""
	}
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

var urlPattern = regexp.MustCompile(`(?i)https?://[^\s<>"'()\[\]]+`)

// Hosts returns the hosts of the http and https links in text.
func Hosts(text string) []string {
	var hosts []string
	for _, raw := range urlPattern.FindAllString(text, -1) {
		u, err := url.Parse(raw)
		if err != nil {
			continue
		}
		if host := normalizeHost(u.Hostname()); host != "" {
			hosts = append(hosts, host)
		}
	}
	return hosts
}

func normalizeHost(host string) string {
	return strings.TrimSuffix(strings.ToLower(strings.TrimSpace(host)), ".")
}
