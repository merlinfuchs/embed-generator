package phishing

import (
	"slices"
	"testing"
)

func TestHosts(t *testing.T) {
	got := Hosts("[Accept](https://Evil.example.com./gift?x=1) and <http://other.test:8080/a> but not ftp://no.test or example.org")
	want := []string{"evil.example.com", "other.test"}
	if !slices.Equal(got, want) {
		t.Errorf("Hosts() = %v, want %v", got, want)
	}
}

func TestPhishingDomain(t *testing.T) {
	c := New(Config{ShortenerDomains: []string{"tinyurl.com"}})

	if got := c.PhishingDomain([]string{"robiox.com.am"}); got != "" {
		t.Errorf("PhishingDomain() before the list loaded = %q, want none", got)
	}

	c.SetDomains([]string{"Robiox.com.am", "rover.party"})

	tests := []struct {
		hosts []string
		want  string
	}{
		{[]string{"discord.com", "www.robiox.com.am"}, "www.robiox.com.am"},
		{[]string{"rover.party"}, "rover.party"},
		{[]string{"com.am", "party", "notrover.party"}, ""},
		{nil, ""},
	}
	for _, tt := range tests {
		if got := c.PhishingDomain(tt.hosts); got != tt.want {
			t.Errorf("PhishingDomain(%v) = %q, want %q", tt.hosts, got, tt.want)
		}
	}

	if got := c.ShortenerDomain([]string{"example.com", "tinyurl.com"}); got != "tinyurl.com" {
		t.Errorf("ShortenerDomain() = %q, want tinyurl.com", got)
	}
}
