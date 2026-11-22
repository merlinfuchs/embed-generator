package forward

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"strings"
	"syscall"
	"time"
)

// MaxURLLength is how long a URL that answers are sent to can be.
const MaxURLLength = 2000

var errPrivateAddress = errors.New("the URL points to a private network address")

// blockedPrefixes are the ranges a request to a URL a user picked must not reach, beyond the
// loopback, link-local, multicast and private ones that netip knows about.
var blockedPrefixes = []netip.Prefix{
	netip.MustParsePrefix("0.0.0.0/8"),
	netip.MustParsePrefix("100.64.0.0/10"), // carrier-grade NAT
	netip.MustParsePrefix("192.0.0.0/24"),
	netip.MustParsePrefix("192.0.2.0/24"),
	netip.MustParsePrefix("198.18.0.0/15"),
	netip.MustParsePrefix("198.51.100.0/24"),
	netip.MustParsePrefix("203.0.113.0/24"),
	netip.MustParsePrefix("240.0.0.0/4"),
	netip.MustParsePrefix("64:ff9b::/96"), // NAT64, which can reach any IPv4 address
	netip.MustParsePrefix("64:ff9b:1::/48"),
	netip.MustParsePrefix("2001:db8::/32"),
	netip.MustParsePrefix("2002::/16"), // 6to4, which embeds an IPv4 address
}

// isPublicAddr is whether addr is on the public internet.
func isPublicAddr(addr netip.Addr) bool {
	addr = addr.Unmap()
	if !addr.IsGlobalUnicast() || addr.IsPrivate() {
		return false
	}
	for _, p := range blockedPrefixes {
		if p.Contains(addr) {
			return false
		}
	}
	return true
}

// ValidateURL checks that answers can be sent to rawURL. Only HTTPS on the default ports is
// allowed. Where a hostname points is checked again when connecting, since it can change.
func ValidateURL(rawURL string) error {
	if len(rawURL) > MaxURLLength {
		return fmt.Errorf("the URL can't be longer than %d characters", MaxURLLength)
	}

	u, err := url.Parse(rawURL)
	if err != nil || u.Host == "" {
		return errors.New("the URL isn't valid")
	}
	if u.Scheme != "https" {
		return errors.New("the URL has to start with https://")
	}
	if u.User != nil {
		return errors.New("the URL can't contain a username or password")
	}
	if port := u.Port(); port != "" && port != "443" && port != "8443" {
		return errors.New("the URL can only use port 443 or 8443")
	}

	host := strings.TrimSuffix(strings.ToLower(u.Hostname()), ".")
	if host == "localhost" || strings.HasSuffix(host, ".localhost") {
		return errPrivateAddress
	}
	if addr, err := netip.ParseAddr(host); err == nil && !isPublicAddr(addr) {
		return errPrivateAddress
	}
	return nil
}

// proxyDenied is the reason Smokescreen gives when it refuses a destination, which Go returns as
// the error of the request.
const proxyDenied = "Request rejected by proxy"

// newClient is an HTTP client for URLs that users pick. It doesn't follow redirects. Without a
// proxy it only connects to public addresses, checked after the hostname is resolved so DNS can't
// point it elsewhere. With one, requests go through it and the proxy does that check, as it's the
// one that resolves the hostname.
func newClient(allowAddr func(netip.Addr) bool, proxy *url.URL) *http.Client {
	dialer := &net.Dialer{Timeout: 5 * time.Second}
	if proxy == nil {
		dialer.Control = func(_, address string, _ syscall.RawConn) error {
			host, _, err := net.SplitHostPort(address)
			if err != nil {
				return err
			}
			addr, err := netip.ParseAddr(host)
			if err != nil || !allowAddr(addr) {
				return errPrivateAddress
			}
			return nil
		}
	}

	return &http.Client{
		Transport: &http.Transport{
			// Never the proxy from the environment.
			Proxy:                 fixedProxy(proxy),
			DialContext:           dialer.DialContext,
			ForceAttemptHTTP2:     true,
			TLSHandshakeTimeout:   5 * time.Second,
			ResponseHeaderTimeout: 10 * time.Second,
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
		},
		Timeout: 10 * time.Second,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
}

func fixedProxy(proxy *url.URL) func(*http.Request) (*url.URL, error) {
	if proxy == nil {
		return nil
	}
	return http.ProxyURL(proxy)
}
