package common

import (
	"testing"
	"time"

	"github.com/jellydator/ttlcache/v3"
	"golang.org/x/sync/singleflight"
)

type thing interface{ Name() string }

// A not-found cached as a nil interface used to panic on the way back out: converting a nil
// interface to any gives a nil any, and asserting that to an interface type is a panic.
func TestGetOrSetCachesNil(t *testing.T) {
	var group singleflight.Group
	cache := ttlcache.New(ttlcache.WithTTL[string, thing](time.Minute))

	calls := 0
	fetch := func() (thing, error) {
		calls++
		return nil, nil
	}

	for range 2 {
		value, err := GetOrSet(&group, "missing", cache, fetch)
		if err != nil {
			t.Fatalf("GetOrSet() error = %v", err)
		}
		if value != nil {
			t.Errorf("GetOrSet() = %v, want nil", value)
		}
	}

	if calls != 1 {
		t.Errorf("fetched %d times, want 1: the nil should be cached", calls)
	}
}
