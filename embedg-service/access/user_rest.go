package access

import (
	"context"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/disgoorg/disgo/rest"
	embedgrest "github.com/merlinfuchs/embed-generator/embedg-service/embedg/rest"
)

// newUserRest builds the rest client for calls made with a user's OAuth token. Discord rate
// limits those per token, but disgo's limiter keys buckets on the route alone, so on the bot's
// client every user would queue behind one bucket. This client has a limiter that keys on the
// token as well, read from the request context (see withRateLimitKey). The client holds no
// token of its own; each request passes the bearer token.
func newUserRest() rest.Rest {
	opts := []rest.ClientConfigOpt{
		rest.WithRateLimiter(newTokenRateLimiter()),
		rest.WithHTTPClient(&http.Client{Timeout: 30 * time.Second}),
	}
	if embedgrest.ProxyURL != "" {
		opts = append(opts, rest.WithURL(embedgrest.ProxyURL))
	}
	return rest.New(rest.NewClient("", opts...))
}

type rateLimitKeyContextKey struct{}

// withRateLimitKey tags a request context with the token it's made with, so the limiter can keep
// a bucket per token. It has to travel on the context because the RateLimiter interface sees only
// the endpoint and the response.
func withRateLimitKey(ctx context.Context, key string) context.Context {
	return context.WithValue(ctx, rateLimitKeyContextKey{}, key)
}

func rateLimitKey(ctx context.Context) string {
	key, _ := ctx.Value(rateLimitKeyContextKey{}).(string)
	return key
}

const (
	tokenRateLimitMaxRetries = 3
	// Buckets whose reset is this far in the past are dropped on the next Wait.
	tokenBucketStaleAfter = 10 * time.Minute
)

type tokenBucket struct {
	remaining int
	reset     time.Time
}

// tokenRateLimiter tracks Discord's per token rate limits. Unlike disgo's limiter it holds no
// lock across a request: with one user behind each bucket the odd overlapping pair is cheaper to
// let through and retry than to serialise. Everything is one map under one mutex, no goroutines.
type tokenRateLimiter struct {
	mu          sync.Mutex
	buckets     map[string]*tokenBucket
	global      time.Time
	lastCleanup time.Time
}

var _ rest.RateLimiter = (*tokenRateLimiter)(nil)

func newTokenRateLimiter() *tokenRateLimiter {
	return &tokenRateLimiter{
		buckets:     make(map[string]*tokenBucket),
		lastCleanup: time.Now(),
	}
}

func (l *tokenRateLimiter) MaxRetries() int { return tokenRateLimitMaxRetries }

func (l *tokenRateLimiter) Close(context.Context) {}

func (l *tokenRateLimiter) Reset() {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.buckets = make(map[string]*tokenBucket)
	l.global = time.Time{}
}

func bucketKey(ctx context.Context, endpoint *rest.CompiledEndpoint) string {
	return rateLimitKey(ctx) + "|" + endpoint.Endpoint.Method + "+" + endpoint.Endpoint.Route + "+" + endpoint.MajorParams
}

func (l *tokenRateLimiter) Wait(ctx context.Context, endpoint *rest.CompiledEndpoint) error {
	l.mu.Lock()
	l.cleanupLocked()

	now := time.Now()
	until := l.global
	b, ok := l.buckets[bucketKey(ctx, endpoint)]
	if ok && b.remaining <= 0 && b.reset.After(until) {
		until = b.reset
	}
	if ok && b.remaining > 0 {
		// Optimistic: counts the request before its response confirms it.
		b.remaining--
	}
	l.mu.Unlock()

	if !until.After(now) {
		return nil
	}
	if deadline, ok := ctx.Deadline(); ok && until.After(deadline) {
		return context.DeadlineExceeded
	}

	timer := time.NewTimer(until.Sub(now))
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-timer.C:
		return nil
	}
}

// Unlock records what Discord said about the bucket. A nil response means the request never
// went out, and since Wait holds nothing there is nothing to release.
func (l *tokenRateLimiter) Unlock(endpoint *rest.CompiledEndpoint, rs *http.Response) error {
	if rs == nil || rs.Header == nil || rs.Request == nil {
		return nil
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	if rs.StatusCode == http.StatusTooManyRequests {
		retryAfter, err := strconv.ParseFloat(rs.Header.Get("Retry-After"), 64)
		if err != nil {
			return nil
		}
		reset := time.Now().Add(time.Duration(retryAfter * float64(time.Second)))
		// A global limit or a Cloudflare ban (no via header) applies to every token from here.
		if rs.Header.Get("X-RateLimit-Global") != "" || rs.Header.Get("via") == "" {
			l.global = reset
			return nil
		}
		l.buckets[bucketKey(rs.Request.Context(), endpoint)] = &tokenBucket{remaining: 0, reset: reset}
		return nil
	}

	remainingHeader := rs.Header.Get("X-RateLimit-Remaining")
	resetAfterHeader := rs.Header.Get("X-RateLimit-Reset-After")
	if remainingHeader == "" || resetAfterHeader == "" {
		return nil
	}
	remaining, err := strconv.Atoi(remainingHeader)
	if err != nil {
		return nil
	}
	resetAfter, err := strconv.ParseFloat(resetAfterHeader, 64)
	if err != nil {
		return nil
	}

	l.buckets[bucketKey(rs.Request.Context(), endpoint)] = &tokenBucket{
		remaining: remaining,
		reset:     time.Now().Add(time.Duration(resetAfter * float64(time.Second))),
	}
	return nil
}

// cleanupLocked drops long expired buckets. Runs inside Wait so nothing needs a goroutine; it's a
// map sweep at most once per tokenBucketStaleAfter.
func (l *tokenRateLimiter) cleanupLocked() {
	now := time.Now()
	if now.Sub(l.lastCleanup) < tokenBucketStaleAfter {
		return
	}
	l.lastCleanup = now
	for key, b := range l.buckets {
		if now.Sub(b.reset) > tokenBucketStaleAfter {
			delete(l.buckets, key)
		}
	}
}
