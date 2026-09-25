package common

import (
	"fmt"
	"sync"
	"time"

	_ "time/tzdata"
)

// time.LoadLocation reads and parses zoneinfo on every call.
var timezones sync.Map

// LoadTimezone loads an IANA timezone, where empty means UTC.
func LoadTimezone(name string) (*time.Location, error) {
	if name == "" {
		return time.UTC, nil
	}
	// "Local" would be the server's own timezone.
	if name == "Local" {
		return nil, fmt.Errorf("unknown timezone %q", name)
	}

	if loc, ok := timezones.Load(name); ok {
		return loc.(*time.Location), nil
	}

	loc, err := time.LoadLocation(name)
	if err != nil {
		return nil, fmt.Errorf("failed to load timezone %q: %w", name, err)
	}
	timezones.Store(name, loc)
	return loc, nil
}
