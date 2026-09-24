package access

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/disgoorg/disgo/rest"
)

// Two tokens hitting the same route must not queue behind each other, and one token must wait
// for its own reset.
func TestTokenRateLimiterIsPerToken(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-RateLimit-Limit", "1")
		w.Header().Set("X-RateLimit-Remaining", "0")
		w.Header().Set("X-RateLimit-Reset-After", "0.5")
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[]`))
	}))
	defer srv.Close()

	client := rest.New(rest.NewClient("", rest.WithRateLimiter(newTokenRateLimiter()), rest.WithURL(srv.URL)))
	call := func(token string) time.Duration {
		start := time.Now()
		ctx := withRateLimitKey(context.Background(), token)
		if _, err := client.GetCurrentUserGuilds(token, 0, 0, 200, false, rest.WithCtx(ctx)); err != nil {
			t.Fatal(err)
		}
		return time.Since(start)
	}

	call("a") // a's bucket is now at 0 for 500ms
	if d := call("b"); d > 200*time.Millisecond {
		t.Fatalf("token b waited %s behind token a's bucket", d)
	}
	if d := call("a"); d < 300*time.Millisecond {
		t.Fatalf("token a did not wait for its own reset, took %s", d)
	}
}

func TestTokenRateLimiterHonoursGlobal(t *testing.T) {
	first := true
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if first {
			first = false
			w.Header().Set("Retry-After", "0.3")
			w.Header().Set("X-RateLimit-Global", "true")
			w.Header().Set("via", "1.1 google")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"message":"rate limited","retry_after":0.3,"global":true}`))
			return
		}
		w.Write([]byte(`[]`))
	}))
	defer srv.Close()

	client := rest.New(rest.NewClient("", rest.WithRateLimiter(newTokenRateLimiter()), rest.WithURL(srv.URL)))
	start := time.Now()
	ctx := withRateLimitKey(context.Background(), "a")
	if _, err := client.GetCurrentUserGuilds("a", 0, 0, 200, false, rest.WithCtx(ctx)); err != nil {
		t.Fatal(err)
	}
	if d := time.Since(start); d < 250*time.Millisecond {
		t.Fatalf("retry did not wait for the global reset, took %s", d)
	}
}
