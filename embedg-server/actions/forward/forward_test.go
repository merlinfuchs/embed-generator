package forward

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/netip"
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

	_, err := newClient(isPublicAddr).Get(server.URL)
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

	resp, err := newClient(allowAll).Get(server.URL)
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

	f, _ := newTestForwarder(server, 1)
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

	f, _ := newTestForwarder(server, 1)
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

	f, _ := newTestForwarder(server, 1)
	err := f.forward(context.Background(), testForm(), server.URL, Submission{})
	if err == nil || !strings.Contains(err.Error(), "404") {
		t.Fatalf("want status error, got %v", err)
	}
	if hits.Load() != 1 {
		t.Fatalf("a 404 shouldn't be retried, got %d requests", hits.Load())
	}
}

func TestForwardRateLimit(t *testing.T) {
	var hits atomic.Int32
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits.Add(1)
	}))
	defer server.Close()

	f, _ := newTestForwarder(server, MaxPerMinute+1)
	if err := f.forward(context.Background(), testForm(), server.URL, Submission{}); err == nil {
		t.Fatal("want rate limit error")
	}
	if hits.Load() != 0 {
		t.Fatal("the request was sent")
	}
}

func TestForwardRecordsAndClearsErrors(t *testing.T) {
	status := atomic.Int32{}
	status.Store(http.StatusNotFound)
	server := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(int(status.Load()))
	}))
	defer server.Close()

	f, fs := newTestForwarder(server, 1)
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
	count  int
	errors chan string
}

func (s *fakeFormStore) IncrementFormForwardCount(context.Context, common.ID, time.Time) (int, error) {
	return s.count, nil
}

func (s *fakeFormStore) SetFormForwardError(_ context.Context, _ common.ID, _ string, message string, _ time.Time) error {
	s.errors <- message
	return nil
}

// newTestForwarder sends to server, which is on the loopback address, and counts count requests
// for every submission.
func newTestForwarder(server *httptest.Server, count int) (*Forwarder, *fakeFormStore) {
	fs := &fakeFormStore{count: count, errors: make(chan string, 1)}
	client := newClient(allowAll)
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
