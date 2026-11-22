package forward

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/merlinfuchs/embed-generator/embedg-server/common"
	"github.com/merlinfuchs/embed-generator/embedg-server/model"
	"github.com/merlinfuchs/embed-generator/embedg-server/store"
)

func TestValidateURL(t *testing.T) {
	valid := []string{
		"https://example.com/hook",
		"https://example.com:443/hook",
		"https://example.com:8443/hook?x=1",
		"https://1.1.1.1/hook",
	}
	for _, u := range valid {
		if err := ValidateURL(u); err != nil {
			t.Errorf("%s: want valid, got %v", u, err)
		}
	}

	invalid := []string{
		"",
		"example.com/hook",
		"http://example.com/hook",
		"ftp://example.com",
		"https://user:pass@example.com",
		"https://example.com:8080/hook",
		"https://localhost/hook",
		"https://api.localhost/hook",
		"https://127.0.0.1/hook",
		"https://10.0.0.1/hook",
		"https://169.254.169.254/latest",
		"https://100.64.0.1/hook",
		"https://[::1]/hook",
		"https://[fd00::1]/hook",
		"https://[::ffff:127.0.0.1]/hook",
		"https://example.com/" + strings.Repeat("a", MaxURLLength),
	}
	for _, u := range invalid {
		if err := ValidateURL(u); err == nil {
			t.Errorf("%s: want invalid", u)
		}
	}
}

func TestIsPublicAddr(t *testing.T) {
	public := []string{"1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"}
	for _, a := range public {
		if !isPublicAddr(netip.MustParseAddr(a)) {
			t.Errorf("%s: want public", a)
		}
	}

	private := []string{
		"0.0.0.0", "127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254",
		"100.100.100.100", "224.0.0.1", "255.255.255.255", "::", "::1", "fe80::1", "fc00::1",
		"::ffff:10.0.0.1", "64:ff9b::a00:1", "2002:a00:1::",
	}
	for _, a := range private {
		if isPublicAddr(netip.MustParseAddr(a)) {
			t.Errorf("%s: want private", a)
		}
	}
}

func TestClientRefusesPrivateAddresses(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
	}))
	defer server.Close()

	_, err := newClient(isPublicAddr, nil).Get(server.URL)
	if !errors.Is(err, errPrivateAddress) {
		t.Fatalf("want private address error, got %v", err)
	}
	if hits.Load() != 0 {
		t.Fatal("the request reached the server")
	}
}

func TestClientDoesNotFollowRedirects(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "http://169.254.169.254/latest", http.StatusFound)
	}))
	defer server.Close()

	resp, err := newClient(allowAll, nil).Get(server.URL)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusFound {
		t.Fatalf("want the redirect itself, got status %d", resp.StatusCode)
	}
}

func TestForwardSignsTheBody(t *testing.T) {
	sub := Submission{
		Type:   "form_submission",
		Form:   SubmissionForm{ID: "f1", Name: "Report"},
		Fields: []SubmissionField{{Key: "reason", Label: "Reason", Type: "text", Value: "spam", IDs: []string{}}},
	}

	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		timestamp := r.Header.Get("X-Signature-Timestamp")
		if r.Header.Get("X-Signature-256") != "sha256="+Sign("secret", timestamp, body) {
			t.Error("signature doesn't match")
		}
		if r.Method != http.MethodPost || r.Header.Get("Content-Type") != "application/json" {
			t.Errorf("unexpected request %s %s", r.Method, r.Header.Get("Content-Type"))
		}

		var got Submission
		if err := json.Unmarshal(body, &got); err != nil || got.Fields[0].Value != "spam" {
			t.Errorf("unexpected body %s", body)
		}
	}))
	defer server.Close()

	f, _ := newTestForwarder(server)
	if err := f.forward(context.Background(), testForm(), server.URL, sub); err != nil {
		t.Fatal(err)
	}
}

func TestForwardRetriesOnce(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if hits.Add(1) == 1 {
			w.WriteHeader(http.StatusBadGateway)
		}
	}))
	defer server.Close()

	f, _ := newTestForwarder(server)
	if err := f.forward(context.Background(), testForm(), server.URL, Submission{}); err != nil {
		t.Fatal(err)
	}
	if hits.Load() != 2 {
		t.Fatalf("want 2 requests, got %d", hits.Load())
	}
}

func TestForwardReportsStatus(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	f, _ := newTestForwarder(server)
	err := f.forward(context.Background(), testForm(), server.URL, Submission{})
	if err == nil || !strings.Contains(err.Error(), "404") {
		t.Fatalf("want status error, got %v", err)
	}
	if hits.Load() != 1 {
		t.Fatalf("a 404 shouldn't be retried, got %d requests", hits.Load())
	}
}

func TestForwardRecordsAndClearsErrors(t *testing.T) {
	status := atomic.Int32{}
	status.Store(http.StatusNotFound)
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(int(status.Load()))
	}))
	defer server.Close()

	f, fs := newTestForwarder(server)
	form := testForm()

	f.Forward(form, server.URL, Submission{})
	msg := <-fs.errors
	if !strings.Contains(msg, "404") {
		t.Fatalf("want the status recorded, got %q", msg)
	}

	status.Store(http.StatusOK)
	form.ForwardError = msg
	f.Forward(form, server.URL, Submission{})
	if msg := <-fs.errors; msg != "" {
		t.Fatalf("want the error cleared, got %q", msg)
	}
}

func allowAll(netip.Addr) bool { return true }

type fakeFormStore struct {
	store.FormStore
	errors chan string
}

func (s *fakeFormStore) SetFormForwardError(_ context.Context, _ common.ID, _ string, message string, _ time.Time) error {
	s.errors <- message
	return nil
}

// fakeSmokescreen is an egress proxy that tunnels CONNECT requests, or refuses them like
// Smokescreen does when refuse is true. It records the hosts it was asked for.
func fakeSmokescreen(t *testing.T, refuse bool, hosts chan<- string) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodConnect {
			t.Errorf("want CONNECT, got %s", r.Method)
			return
		}
		hosts <- r.Host
		conn, _, err := w.(http.Hijacker).Hijack()
		if err != nil {
			t.Error(err)
			return
		}
		if refuse {
			// Smokescreen's own reason phrase, which Go returns as the error.
			_, _ = io.WriteString(conn, "HTTP/1.1 407 "+proxyDenied+"\r\nContent-Length: 0\r\n\r\n")
			conn.Close()
			return
		}

		upstream, err := net.Dial("tcp", r.Host)
		if err != nil {
			t.Error(err)
			conn.Close()
			return
		}
		_, _ = io.WriteString(conn, "HTTP/1.1 200 OK\r\n\r\n")
		go func() { _, _ = io.Copy(upstream, conn) }()
		_, _ = io.Copy(conn, upstream)
		conn.Close()
		upstream.Close()
	}))
}

// newProxiedForwarder sends to server through the proxy at proxyURL.
func newProxiedForwarder(t *testing.T, server *httptest.Server, proxyURL string) (*Forwarder, *fakeFormStore) {
	proxy, err := url.Parse(proxyURL)
	if err != nil {
		t.Fatal(err)
	}
	f, fs := newTestForwarder(server)
	client := newClient(isPublicAddr, proxy)
	client.Transport.(*http.Transport).TLSClientConfig = server.Client().Transport.(*http.Transport).TLSClientConfig
	f.client = client
	return f, fs
}

func TestForwardGoesThroughTheProxy(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
	}))
	defer server.Close()
	hosts := make(chan string, 2)
	proxy := fakeSmokescreen(t, false, hosts)
	defer proxy.Close()

	// The server is on loopback, which only the proxy may decide to reach.
	f, _ := newProxiedForwarder(t, server, proxy.URL)
	if err := f.forward(context.Background(), testForm(), server.URL, Submission{}); err != nil {
		t.Fatal(err)
	}
	if hits.Load() != 1 || <-hosts != strings.TrimPrefix(server.URL, "https://") {
		t.Fatal("the request didn't go through the proxy")
	}
}

func TestForwardReportsWhatTheProxyRefuses(t *testing.T) {
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("the request reached the server")
	}))
	defer server.Close()
	hosts := make(chan string, 2)
	proxy := fakeSmokescreen(t, true, hosts)
	defer proxy.Close()

	f, _ := newProxiedForwarder(t, server, proxy.URL)
	err := f.forward(context.Background(), testForm(), server.URL, Submission{})
	if err == nil || err.Error() != cantSendErr(errPrivateAddress).Error() {
		t.Fatalf("want the private address error, got %v", err)
	}
	if len(hosts) != 1 {
		t.Fatalf("want one try, the proxy was asked %d times", len(hosts))
	}
}

// newTestForwarder sends to server, which is on the loopback address.
func newTestForwarder(server *httptest.Server) (*Forwarder, *fakeFormStore) {
	fs := &fakeFormStore{errors: make(chan string, 1)}
	client := newClient(allowAll, nil)
	client.Transport.(*http.Transport).TLSClientConfig = server.Client().Transport.(*http.Transport).TLSClientConfig
	return &Forwarder{
		client:      client,
		formStore:   fs,
		now:         time.Now,
		validateURL: func(string) error { return nil },
	}, fs
}

func testForm() *model.Form {
	return &model.Form{ID: "f1", GuildID: common.DefinitelyID("1"), SigningSecret: "secret"}
}
